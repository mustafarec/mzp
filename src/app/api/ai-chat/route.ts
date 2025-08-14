// src/app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { Product } from '@/types';

const GOOGLE_AI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// In-memory cache for products
let productCache: {
  data: Product[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getAllActiveProducts(): Promise<Product[]> {
  const now = Date.now();
  if (productCache && now - productCache.timestamp < CACHE_DURATION) {
    return productCache.data;
  }
  
  try {
    const snapshot = await getDocs(
      query(collection(db, 'products'), where('isActive', '==', true))
    );
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
    
    // Update cache
    productCache = {
      data: products,
      timestamp: now,
    };
    
    return products;
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

ÖNEMLİ KURALLAR:
1.  **Uzmanlık Alanı:** SADECE bahçe, bitki, tarım ve ziraat konularında yardım et. Alakasız konularda nazikçe reddet ve uzmanlık alanını belirt.
2.  **Ürün Önerisi:** YALNIZCA aşağıdaki "MEVCUT ÜRÜN KATALOĞU" listesindeki ürünleri öner. Asla var olmayan bir ürün önerme. Maksimum 3 ürün öner.
3.  **Dil ve Üslup:** Türkçe, samimi ve anlaşılır bir dil kullan. Yanıtların kısa ve net olsun.
4.  **Tutarlılık:** Önceki konuşmaları dikkate alarak tutarlı yanıtlar ver.
5.  **HTML Formatlama:** Yanıtlarını zenginleştirmek için MUTLAKA HTML etiketleri kullan.
    *   Önerdiğin her ürünün adını **tam olarak** katalogdaki gibi yaz ve **<strong>ÜRÜN ADI</strong>** şeklinde vurgula.
    *   Başlıklar için \`<h4>Başlık</h4>\` kullan (örn: \`<h4>Sorun Analizi</h4>\`).
    *   Listeler için \`<ul>\` ve \`<li>\` kullan.
    *   Vurgu için \`<em>italik</em>\` ve \`</br>\` etiketlerini kullanabilirsin.

MEVCUT ÜRÜN KATALOĞU:
${productList}${contextInfo}

Kullanıcı sorusuna uygun olan ürünleri yukarıdaki listeden seç ve öner. Eğer uygun ürün yoksa, iletişim bilgilerini ver:
📞 (0212) 672 99 56
📧 info@marmaraziraat.com

ÖRNEK YANIT FORMATI:
<h4>Sorun Analizi</h4>
<p>Gözlemlerime göre bitkinizde ... belirtileri var. Bu durum genellikle ... kaynaklanır.</p>

<h4>Çözüm Önerileri</h4>
<p>Bu sorunu çözmek için aşağıdaki adımları ve ürünleri tavsiye ederim:</p>
<ul>
  <li>Öncelikle, <strong>ÖRNEK ÜRÜN 1</strong> kullanarak toprağı zenginleştirin.</li>
  <li>Ardından, <strong>ÖRNEK ÜRÜN 2</strong> ile bitkinizi düzenli olarak ilaçlayın.</li>
</ul>
<p>Daha fazla bilgi için bizimle iletişime geçebilirsiniz.</p>`;
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
    
    // Konu dışı mesaj kontrolü
    if (message && !imageBase64) {
      const messageWords = message.toLowerCase().trim();
      const simpleGreetings = [
        'merhaba', 'selam', 'selamün aleyküm', 'naber', 'nasılsın', 
        'hey', 'günaydın', 'iyi günler', 'iyi akşamlar', 'mrb', 'slm'
      ];

      // 1. Kısa ve alakasız selamlama mesajlarını yakala
      if (simpleGreetings.includes(messageWords)) {
        const friendlyGreeting = `Merhaba! Ben Marmara Ziraat'in dijital bahçe danışmanıyım. 🌱<br><br>Bitki sorunlarınız, ürün tavsiyeleri veya bahçe bakımı hakkında size nasıl yardımcı olabilirim?`;
        return NextResponse.json({ 
            message: friendlyGreeting,
            timestamp: new Date().toISOString(),
            rejected: true // Ön uçta yeni mesaj olarak eklenmemesi için
        });
      }

      // 2. Bahçe ile ilgili anahtar kelime var mı diye kontrol et
      const gardenKeywords = [
        'bitki', 'çiçek', 'ağaç', 'çim', 'bahçe', 'tohum', 'gübre', 'ilaç', 'hastalık', 'böcek', 'haşere',
        'yaprak', 'toprak', 'sulama', 'budama', 'peyzaj', 'meyve', 'sebze', 'tarım', 'ziraat', 'fide', 'fidan', 'zararlı',
        'menekşe', 'gül', 'papatya', 'lale', 'karanfil', 'orkide', 'begonya', 'petunya', 'sümbül', 'nergis', 'sardunya', 'leylak', 'zambak', 'açelya', 'rododendron',
        'soldu', 'kurudu', 'sarardı', 'solgun', 'hasta', 'çürük', 'sararma', 'kuruma', 'solma', 'çürüme', 'leke', 'kahverengi', 'beyazlaşma',
        'saksı', 'çimlendirme', 'ekim', 'dikim', 'çapa', 'kürek', 'hortum', 'sprinkler', 'sera', 'kompost', 'mulç',
        'akar', 'thrips', 'yaprak biti', 'mantar', 'küf', 'mildiyö', 'pas hastalığı', 'trip', 'beyaz sinek', 'kırmızı örümcek'
      ];
      const hasGardenKeyword = gardenKeywords.some(keyword => messageWords.includes(keyword));

      // 3. Bahçe anahtar kelimesi yoksa, açıkça konu dışı mı diye kontrol et
      if (!hasGardenKeyword) {
        const clearlyOffTopicKeywords = [
          'kimsin', 'adın ne', 'kaç yaşında', 'nerelisin', 'sen kimsin',
          'telefon', 'araba', 'film', 'müzik', 'spor', 'politika', 'hava durumu',
          'yemek', 'tarif', 'kıyafet', 'teknoloji', 'bilgisayar', 'oyun', 'döviz', 'borsa', 'fatura', 'sipariş', 'kargo'
        ];
        
        const hasOffTopicKeyword = clearlyOffTopicKeywords.some(keyword => messageWords.includes(keyword));
        
        if (hasOffTopicKeyword) {
          const rejectionMessage = `<strong>Merhaba!</strong> Ben Marmara Ziraat'in bahçe danışmanıyım. 🌱<br><br>Size <strong>bahçe ürünleri</strong>, <strong>bitki hastalıkları</strong>, <strong>gübre</strong> ve <strong>peyzaj</strong> konularında yardımcı olabilirim. Farklı bir konuda uzmanlığım bulunmuyor.<br><br>Bahçenizle ilgili sorularınızı bekliyorum.`;
          return NextResponse.json({ 
            message: rejectionMessage,
            timestamp: new Date().toISOString(),
            rejected: true
          });
        }
      }
    }

    const products = await getAllActiveProducts();
    const systemPrompt = createSystemPrompt(products, conversationHistory);
    
    
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