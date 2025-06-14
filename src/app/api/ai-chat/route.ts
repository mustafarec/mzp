import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { Product } from '@/types';

const GOOGLE_AI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function getAllActiveProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'products'), where('isActive', '==', true))
    );
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error) {
    console.error('Ürünler getirme hatası:', error);
    return [];
  }
}

function createSystemPrompt(products: Product[]): string {
  const productList = products.map(p => `- ${p.name} (${p.slug}): ${p.description?.replace(/<[^>]*>/g, '')?.slice(0, 100) || 'Açıklama yok'}`).join('\n');
  
  return `Sen Marmara Ziraat şirketinin uzman bahçe danışmanısın. Görevin:

KURALLAR:
1. SADECE mevcut ürün kataloğundaki ürünleri öner
2. Maksimum 3-4 ürün öner
3. Bitki adlarını doğru kullan (ör: gül, çim, domates)
4. Türkçe konuş, kısa ve net yanıt ver
5. Var olmayan ürün önerme

MEVCUT ÜRÜN KATALOĞU:
${productList}

Kullanıcı sorusuna uygun olan ürünleri yukarıdaki listeden seç ve öner. Eğer uygun ürün yoksa, iletişim bilgilerini ver:
📞 (0212) 672 99 56
📧 info@marmaraziraat.com

Yanıt formatı (HTML kullan):
1. <strong>Sorun analizi</strong> (1-2 cümle)
2. <strong>Önerilen ürünler</strong> (sadece mevcut kataloğdan)
3. <strong>Uygulama önerileri</strong>

HTML etiketleri kullan: <strong>, <em>, <br>, <ul>, <li>
Her önerdiğin ürünün adını tam olarak katalogdaki gibi yaz.`;
}

async function convertImageToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return base64;
}

export async function POST(request: NextRequest) {
  try {
    let message = '';
    let imageBase64 = '';
    let imageMimeType = '';

    // Check if request has form data (image + text)
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = formData.get('message') as string || '';
      const imageFile = formData.get('image') as File;
      
      if (imageFile) {
        imageBase64 = await convertImageToBase64(imageFile);
        imageMimeType = imageFile.type;
      }
    } else {
      const body = await request.json();
      message = body.message;
    }

    if (!message && !imageBase64) {
      return NextResponse.json(
        { error: 'Mesaj veya resim gerekli' },
        { status: 400 }
      );
    }

    if (!GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key bulunamadı');
    }

    const products = await getAllActiveProducts();
    const systemPrompt = createSystemPrompt(products);
    
    // Build content parts
    const parts: any[] = [];
    
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64
        }
      });
    }
    
    if (message) {
      const prompt = imageBase64 
        ? `${systemPrompt}\n\nKullanıcı resim gönderdi ve şunu soruyor: ${message}\n\nResimdeki bitki/bahçe sorunu hakkında analiz yap ve uygun ürün öner.`
        : `${systemPrompt}\n\nKullanıcı sorusu: ${message}`;
      
      parts.push({
        text: prompt
      });
    } else if (imageBase64) {
      parts.push({
        text: `${systemPrompt}\n\nKullanıcı bir resim gönderdi. Resimdeki bitki, hastalık veya bahçe sorunu hakkında analiz yap ve katalogdaki uygun ürünleri öner.`
      });
    }

    const response = await fetch(`${API_URL}?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API hatası:', response.status, errorText);
      throw new Error(`Google AI API hatası: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Geçersiz API yanıtı:', data);
      throw new Error('Google AI API geçersiz yanıt');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    try {
      const sessionData = {
        message: message.trim(),
        timestamp: Timestamp.now(),
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      };
      await addDoc(collection(db, 'chat_sessions'), sessionData);
    } catch (trackingError) {
      console.error('Chat tracking hatası (devam ediliyor):', trackingError);
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'analytics'), {
        date: today,
        chatUsage: 1,
        timestamp: Timestamp.now()
      });
    } catch (analyticsError) {
      console.error('Analytics hatası (devam ediliyor):', analyticsError);
    }

    return NextResponse.json({ 
      message: aiResponse,
      timestamp: new Date().toISOString(),
      products: products
    });

  } catch (error) {
    console.error('AI Chat API Hatası:', error);
    
    const fallbackMessage = `Merhaba! Şu anda AI hizmetimizde teknik bir sorun yaşanıyor. 

Bahçe ürünleri ve peyzaj malzemeleri konusunda size yardımcı olmak için lütfen bizimle iletişime geçin:

📞 (0212) 672 99 56
📧 info@marmaraziraat.com.tr

Çim tohumu, gübre, bahçe makineleri ve bitki hastalık ilaçları konularında uzman ekibimiz size yardımcı olacaktır.`;

    return NextResponse.json({ 
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
} 