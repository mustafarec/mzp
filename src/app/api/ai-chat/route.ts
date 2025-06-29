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

// İçerik kontrolü için prompt
function createContentCheckPrompt(): string {
  return `Bu resim bahçe, bitki, tarım, ziraat, peyzaj veya botanik ile ilgili mi?

SADECE şu kelimelerden biri ile cevap ver: BAHCE_ILGILI veya KONU_DISI

BAHÇE İLE İLGİLİ KONULAR:
- Bitkiler (çiçek, ağaç, çim, sebze, meyve, yaprak)
- Hastalık belirtileri (yaprak sararması, leke, çürüme, solgunluk)
- Zararlılar (böcek, haşere, mantar, küf)
- Toprak problemleri (renk değişimi, kırılgan yapı)
- Bahçe aletleri ve ekipmanları
- Peyzaj düzenlemesi
- Tarımsal ürünler ve alanlar

KONU DIŞI (REDDEDILECEK):
- İnsan, hayvan, yiyecek hazır ürünler
- Kıyafet, ayakkabı, aksesuar
- Araç, bina, ev eşyası
- Elektronik cihazlar
- Spor malzemeleri
- Bahçe/tarım ile ilgisi olmayan diğer konular`;
}

function createSystemPrompt(products: Product[], conversationHistory?: any[]): string {
  const productList = products.map(p => `- ${p.name} (${p.slug}): ${p.description?.replace(/<[^>]*>/g, '')?.slice(0, 100) || 'Açıklama yok'}`).join('\n');
  
  let contextInfo = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-6); // Son 6 mesaj
    const contextMessages = recentMessages.map((msg: any) => 
      `${msg.sender === 'user' ? 'Kullanıcı' : 'Sen'}: ${msg.content?.replace(/<[^>]*>/g, '') || ''}`
    ).join('\n');
    
    contextInfo = `\n\nKONUŞMA GEÇMİŞİ (Referans için):
${contextMessages}

Bu konuşma geçmişini dikkate alarak, kullanıcının yeni sorusuna uygun ve tutarlı bir yanıt ver.`;
  }
  
  return `Sen Marmara Ziraat şirketinin uzman bahçe danışmanısın. Görevin:

ÖNEMLİ: SADECE bahçe, bitki, tarım ve ziraat konularında yardım et!

KURALLAR:
1. Önce mesajın bahçe/bitki ile ilgili olup olmadığını değerlendir
2. Eğer bahçe ile ilgili değilse nazik şekilde reddet ve alanını açıkla
3. SADECE mevcut ürün kataloğundaki ürünleri öner
4. Maksimum 3-4 ürün öner
5. Bitki adlarını doğru kullan (ör: gül, çim, domates, menekşe)
6. Türkçe konuş, kısa ve net yanıt ver
7. Var olmayan ürün önerme
8. Önceki konuşmalarda verdiğin tavsiyeleri hatırla ve tutarlı ol

MEVCUT ÜRÜN KATALOĞU:
${productList}${contextInfo}

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

// Resim içerikini kontrol et (bahçe ile ilgili mi?)
async function checkImageContent(imageBase64: string, imageMimeType: string): Promise<boolean> {
  try {
    const contentCheckPrompt = createContentCheckPrompt();
    
    const response = await fetch(`${API_URL}?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: imageMimeType,
                  data: imageBase64
                }
              },
              {
                text: contentCheckPrompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('İçerik kontrol API hatası:', response.status);
      return true; // Hata durumunda işleme devam et
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Yanıtı temizle ve kontrol et
    const cleanResponse = aiResponse.trim().toUpperCase();
    return cleanResponse.includes('BAHCE_ILGILI');
    
  } catch (error) {
    console.error('İçerik kontrol hatası:', error);
    return true; // Hata durumunda işleme devam et
  }
}

export async function POST(request: NextRequest) {
  try {
    let message = '';
    let imageBase64 = '';
    let imageMimeType = '';
    let conversationHistory: any[] = [];

    // Check if request has form data (image + text)
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = formData.get('message') as string || '';
      const historyString = formData.get('history') as string;
      if (historyString) {
        try {
          conversationHistory = JSON.parse(historyString);
        } catch (e) {
          console.error('History parse hatası:', e);
        }
      }
      const imageCount = parseInt(formData.get('imageCount') as string || '0');
      
      // Multiple images support
      const imageFiles: File[] = [];
      const imageBase64s: string[] = [];
      const imageMimeTypes: string[] = [];
      
      for (let i = 0; i < imageCount; i++) {
        const imageFile = formData.get(`image_${i}`) as File;
        if (imageFile) {
          imageFiles.push(imageFile);
          imageBase64s.push(await convertImageToBase64(imageFile));
          imageMimeTypes.push(imageFile.type);
        }
      }
      
      // Legacy single image support
      if (imageBase64s.length === 0) {
        const imageFile = formData.get('image') as File;
        if (imageFile) {
          imageBase64 = await convertImageToBase64(imageFile);
          imageMimeType = imageFile.type;
        }
      } else {
        // Use first image for legacy compatibility
        imageBase64 = imageBase64s[0] || '';
        imageMimeType = imageMimeTypes[0] || '';
      }
    } else {
      const body = await request.json();
      message = body.message;
      conversationHistory = body.history || [];
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

    // Resim varsa içerik kontrolü yap
    if (imageBase64) {
      const isGardenRelated = await checkImageContent(imageBase64, imageMimeType);
      
      if (!isGardenRelated) {
        // Bahçe ile ilgili değilse, nazik reddetme mesajı döndür
        const rejectionMessage = `<strong>Bu resim bahçe ve ziraat alanımızla ilgili görünmüyor.</strong><br><br>

Size <strong>bahçe ürünleri</strong>, <strong>bitki hastalıkları</strong>, <strong>gübre</strong>, <strong>tohum</strong> ve <strong>peyzaj</strong> konularında yardımcı olabilirim.<br><br>

<strong>Yardımcı olabileceğim konular:</strong>
<ul>
<li>🌱 Bitki hastalıkları ve tedavi yöntemleri</li>
<li>🌿 Gübre ve beslenme sorunları</li>
<li>🌾 Çim ve tohum problemleri</li>
<li>🌸 Bahçe düzenlemesi ve peyzaj</li>
<li>🐛 Zararlı kontrolü ve ilaçlama</li>
</ul>

Bahçe ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:<br>
📞 <strong>(0212) 672 99 56</strong><br>
📧 <strong>info@marmaraziraat.com</strong>`;

        return NextResponse.json({ 
          message: rejectionMessage,
          timestamp: new Date().toISOString(),
          rejected: true
        });
      }
    }

    const products = await getAllActiveProducts();
    const systemPrompt = createSystemPrompt(products, conversationHistory);
    
    console.log('💬 Conversation history length:', conversationHistory.length);
    console.log('📝 Current message:', message);
    
    // Build content parts
    const parts: any[] = [];
    
    // Add multiple images if available
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageCount = parseInt(formData.get('imageCount') as string || '0');
      
      for (let i = 0; i < imageCount; i++) {
        const imageFile = formData.get(`image_${i}`) as File;
        if (imageFile) {
          const base64 = await convertImageToBase64(imageFile);
          parts.push({
            inline_data: {
              mime_type: imageFile.type,
              data: base64
            }
          });
        }
      }
      
      // Legacy single image support
      if (imageCount === 0 && imageBase64) {
        parts.push({
          inline_data: {
            mime_type: imageMimeType,
            data: imageBase64
          }
        });
      }
    } else if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64
        }
      });
    }
    
    if (message) {
      // Text mesajları için genişletilmiş konu kontrolü
      const gardenKeywords = [
        // Genel bahçe terimleri
        'bitki', 'çiçek', 'ağaç', 'çim', 'bahçe', 'tohum', 'gübre', 'ilaç', 'hastalık', 'böcek', 
        'yaprak', 'toprak', 'sulama', 'budama', 'peyzaj', 'meyve', 'sebze', 'tarım', 'ziraat',
        
        // Çiçek ve bitki isimleri
        'menekşe', 'gül', 'papatya', 'lale', 'karanfil', 'orkide', 'begonyal', 'petunya', 
        'sümbül', 'nergis', 'sardunya', 'leylak', 'zambak', 'açelya', 'rododenron',
        
        // Durum ve problem kelimeleri
        'soldu', 'kurudu', 'sarardı', 'solgun', 'hasta', 'çürük', 'sararma', 'kuruma',
        'solma', 'hastalık', 'çürüme', 'leke', 'kahverengi', 'beyazlaşma',
        
        // Bahçe araçları ve malzemeleri
        'saksı', 'çimlendirme', 'ekim', 'dikim', 'fide', 'fidan', 'çapa', 'kürek',
        'hortum', 'sprinkler', 'sera', 'kompost', 'mulç',
        
        // Zararlı ve hastalıklar
        'akar', 'thrips', 'yaprak biti', 'mantar', 'küf', 'mildiyö', 'pas hastalığı',
        'trip', 'beyaz sinek', 'kırmızı örümcek'
      ];
      const messageWords = message.toLowerCase();
      const hasGardenKeyword = gardenKeywords.some(keyword => messageWords.includes(keyword));
      
      // Eğer resim yoksa ve bahçe ile ilgili anahtar kelime yoksa, sadece açıkça alakasız mesajları reddet
      if (!imageBase64 && !hasGardenKeyword && message.length > 10) {
        // Çok açık şekilde alakasız konuları kontrol et
        const clearlyOffTopicKeywords = [
          'merhaba', 'selam', 'nasılsın', 'kim', 'adın ne', 'kaç yaşında', 'nereli',
          'telefon', 'araba', 'film', 'müzik', 'spor', 'politik', 'hava durumu',
          'yemek', 'tarif', 'kıyafet', 'teknoloji', 'bilgisayar', 'oyun'
        ];
        
        const hasOffTopicKeyword = clearlyOffTopicKeywords.some(keyword => 
          messageWords.includes(keyword)
        );
        
        // Sadece açıkça alakasız konularda otomatik mesaj gönder
        if (hasOffTopicKeyword) {
          const rejectionMessage = `<strong>Merhaba!</strong> Ben Marmara Ziraat'in bahçe danışmanıyım. 🌱<br><br>

Size <strong>bahçe ürünleri</strong>, <strong>bitki hastalıkları</strong>, <strong>gübre</strong>, <strong>tohum</strong> ve <strong>peyzaj</strong> konularında yardımcı olabilirim.<br><br>

<strong>Yardımcı olabileceğim konular:</strong>
<ul>
<li>🌱 Bitki hastalıkları ve tedavi yöntemleri</li>
<li>🌿 Gübre ve beslenme sorunları</li>
<li>🌾 Çim ve tohum problemleri</li>
<li>🌸 Bahçe düzenlemesi ve peyzaj</li>
<li>🐛 Zararlı kontrolü ve ilaçlama</li>
</ul>

Bahçe ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:<br>
📞 <strong>(0212) 672 99 56</strong><br>
📧 <strong>info@marmaraziraat.com</strong>`;

          return NextResponse.json({ 
            message: rejectionMessage,
            timestamp: new Date().toISOString(),
            rejected: true
          });
        }
      }
      
      const hasImages = parts.some(part => part.inline_data);
      const prompt = hasImages 
        ? `${systemPrompt}\n\nKullanıcı ${parts.filter(p => p.inline_data).length} resim gönderdi ve şunu soruyor: ${message}\n\nResimlerdeki bitki/bahçe sorunları hakkında analiz yap ve uygun ürün öner.`
        : `${systemPrompt}\n\nKullanıcı sorusu: ${message}`;
      
      parts.push({
        text: prompt
      });
    } else if (parts.some(part => part.inline_data)) {
      const imageCount = parts.filter(p => p.inline_data).length;
      parts.push({
        text: `${systemPrompt}\n\nKullanıcı ${imageCount} resim gönderdi. Resimlerdeki bitki, hastalık veya bahçe sorunları hakkında analiz yap ve katalogdaki uygun ürünleri öner.`
      });
    }

    console.log('🚀 Sending to AI API, parts count:', parts.length);
    console.log('🎯 System prompt preview:', systemPrompt.substring(0, 200) + '...');

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
      console.error('❌ Google AI API hatası:', response.status, errorText);
      throw new Error(`Google AI API hatası: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Geçersiz API yanıtı:', data);
      throw new Error('Google AI API geçersiz yanıt');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('✅ AI response received, length:', aiResponse.length);
    console.log('🎯 Response preview:', aiResponse.substring(0, 150) + '...');

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