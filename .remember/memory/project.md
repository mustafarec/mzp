# Marmara Ziraat Proje Tercihleri

## Tech Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Firebase (Firestore, Auth, Storage)
- Radix UI Components
- React Hook Form + Zod

## Kod Tercihleri
- Server Components öncelik
- Client Components sadece gerektiğinde
- Turkish naming conventions
- Type-safe kod
- CSS Modules yerine Tailwind

## Dosya Yapısı
```
src/
  app/ - Next.js App Router
  components/ - React bileşenleri
    ui/ - Shadcn/ui bileşenleri
    layout/ - Layout bileşenleri
    forms/ - Form bileşenleri
    product/ - Ürün bileşenleri
  lib/ - Utility fonksiyonlar
  types/ - TypeScript tipleri
```

## Firebase Yapısı
- products collection
- categories collection  
- Firestore Security Rules aktif
- Environment variables kullanımı

## Yapılacaklar Listesi

### Öncelikli
1. **Excel ile Ürün İmport** - Admin paneline Excel upload özelliği
2. **Sitemap.xml** - SEO için otomatik sitemap oluşturma
3. **404 Sayfa Tasarımı** - Özel hata sayfası
4. **Global Search** - Ürün arama özelliği

### Performans & SEO
- Structured data (JSON-LD) ekle
- Social media meta tags (Open Graph, Twitter Cards)
- Analytics entegrasyonu
- Image optimization (WebP format)

### Kullanıcı Deneyimi
- Loading skeleton'ları iyileştir
- Breadcrumb navigation'ı global yap
- Ürün karşılaştırma özelliği
- Favori/Wishlist özelliği

### Teknik İyileştirmeler
- PWA özellikleri (offline support, install prompt)
- Lazy loading optimizasyonu
- Kategori filtreleme sayfası

## Excel Import Gereksinimleri
- İsim, Açıklama, SKU, Marka, Kategoriler, Resim URL kolonları
- Çoklu resim URL'i desteği
- Firebase Storage'a resim yükleme
- Validation ve error handling
- Progress bar ve batch processing 