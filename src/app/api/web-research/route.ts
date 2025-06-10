import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Web araştırması simülasyonu - gerçek projede Firecrawl/web search entegrasyonu
    const insights = await performWebSearch(query);
    
    return NextResponse.json({ 
      insights,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Web research API error:', error);
    return NextResponse.json(
      { error: 'Web araştırması başarısız oldu' },
      { status: 500 }
    );
  }
}

async function performWebSearch(query: string): Promise<string[]> {
  // Kaktüs özel bilgi bankası
  const cactusKnowledge = [
    "Kaktüslerin yavaş büyümesi genellikle yetersiz ışık, yanlış toprak karışımı veya aşırı sulama nedeniyledir",
    "Kaktüs gübresi NPK oranı 2-10-10 olmalı - yüksek azot kaktüsleri öldürür",
    "Drenajlı toprak karışımı şart: %50 kum + %25 perlit + %25 toprak",
    "Kış aylarında sulama aylık 1 kez, yaz aylarında 2 haftada 1 kez yeterli",
    "Kaktüs sarılaşması %80 aşırı sulama nedeniyle - derhal sulamayı kesin"
  ];

  const grassKnowledge = [
    "Çim sarılaşması genellikle azot eksikliği, kuraklık stresi veya hastalık nedeniyledir",
    "İdeal çim gübresi NPK oranı 20-5-10 - bahar ve sonbahar uygulaması",
    "Çim sulama sabah 6-8 saatleri ideal - öğlen sulamak zararlı",
    "Haftada 2-3 kez derin sulama, günlük yüzeysel sulamadan çok daha etkili",
    "Çim biçme yüksekliği 5-7 cm - çok kısa kesmek strese neden olur"
  ];

  const flowerKnowledge = [
    "Çiçeklenme döneminde fosfor oranı yüksek gübre (5-15-5) kullanın",
    "Çiçek sarılaşması demir eksikliği veya toprak pH probleminden kaynaklanabilir",
    "Optimal toprak pH çiçekler için 6.0-7.0 arasında olmalı",
    "Solmuş çiçekleri temizlemek yeni çiçeklenmeyi teşvik eder",
    "Çiçekler için düzenli ama ölçülü sulama - aşırı nem kök çürümesine neden olur"
  ];

  const vegetableKnowledge = [
    "Sebzeler için dengeli NPK gübresi (10-10-10) ve organik kompost ideal",
    "Domates sarılaşması genellikle kalsiyum eksikliği veya düzensiz sulamadan",
    "Sebze bahçesi için toprak nemli tutulmalı ama su basmamalı",
    "Organik gübreler kimyasal gübrelerden daha güvenli ve uzun etkili",
    "Rotasyon sistemi uygulayın - aynı yere aynı sebzeyi art arda ekmeyin"
  ];

  const snakeKnowledge = [
    "Yılanlar temiz ve düzenli bahçelerden kaçınır - düzenli temizlik yapın",
    "Nane, sarımsak ve marigold çiçekleri doğal yılan kovucudur",
    "Odun yığınları, çalı altları ve karanlık alanları temizleyin",
    "Yılan kovucu spreyler güvenli ve etkili çözümdür",
    "Bahçede titreşim oluşturun - yılanlar vibrasyondan kaçar"
  ];

  const animalKnowledge = [
    "Ultrasonik cihazlar zararlı hayvanlar için etkili kovucu yöntemdir",
    "Doğal kovucu bitkiler: lavanta, biberiye, nane hayvanları uzaklaştırır",
    "Fiziksel bariyerler en kalıcı çözümdür - tel örgü ve çitler",
    "Hayvan kovucu spreyler insan ve evcil hayvan için güvenlidir",
    "Gece ışığı fare ve tavşan gibi gece aktif hayvanları uzaklaştırır"
  ];

  const toolKnowledge = [
    "Kaliteli bahçe aletleri uzun vadede daha ekonomiktir",
    "Temel alet seti: kürek, çapa, budama makası, hortum, eldiven",
    "Motorlu aletler büyük bahçeler için zaman tasarrufu sağlar",
    "Aletlerin düzenli bakımı performansı artırır ve ömrü uzatır",
    "Ergonomik alet seçimi bel ve sırt problemlerini önler"
  ];

  const irrigationKnowledge = [
    "Damla sulama sistemi %30-50 su tasarrufu sağlar",
    "Otomatik zamanlayıcılar sabah erken saatlerde sulama yapar",
    "Toprak nem sensörleri aşırı sulamayı önler",
    "Mikro sprinkler sistemleri küçük alanlar için idealdir",
    "Yağmurlama sistemleri geniş çim alanları için uygundur"
  ];

  // Anahtar kelime bazında bilgi seçimi
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('yılan') || lowerQuery.includes('snake')) {
    return snakeKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('hayvan') || lowerQuery.includes('zararlı')) {
    return animalKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('alet') || lowerQuery.includes('makine')) {
    return toolKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('sulama') || lowerQuery.includes('sprinkler')) {
    return irrigationKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('kaktüs') || lowerQuery.includes('sukkulent')) {
    return cactusKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('çim') || lowerQuery.includes('grass')) {
    return grassKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('çiçek') || lowerQuery.includes('flower')) {
    return flowerKnowledge.slice(0, 3);
  } else if (lowerQuery.includes('sebze') || lowerQuery.includes('domates')) {
    return vegetableKnowledge.slice(0, 3);
  } else {
    // Genel bitki bakım bilgileri
    return [
      "Bitki sağlığı ışık, su, besin ve toprak kalitesinin dengesine bağlıdır",
      "Aşırı sulama bitki ölümlerinin %1 numaralı nedenidir",
      "Organik gübreler kimyasal gübrelerden daha güvenli ve çevre dostudur",
      "Mevsimsel bakım takvimi oluşturmak başarının anahtarıdır",
      "Her bitki türünün kendine özel ihtiyaçları vardır"
    ].slice(0, 3);
  }
} 