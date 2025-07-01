'use client';

import { forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Sprout } from 'lucide-react';

// Bahçe ipuçları
const gardenTips = [
  "Bitki satın alırken yapraklarının parlak ve sağlıklı olduğunu kontrol edin",
  "Ev içi bitkileri haftada bir kez döndürün ki tüm tarafları ışık alsın",
  "Bitki besini uygularken her zaman etiket talimatlarını takip edin",
  "Yeni aldığınız bitkileri diğerlerinden ayrı tutun, hastalık kontrolü için",
  "Kaktüsler ve sukulent bitkiler çok az suya ihtiyaç duyar",
  "Bitki yapraklarını düzgün temizlemek fotosentezi artırır",
  "Sera etkisi yaratmak için bitkilerinizi cam kavanozlarda yetitirebilirsiniz",
  "Basit aşılama teknikleri ile eski bitkileri yenileyebilirsiniz",
  "Doğal böcek kovucular lavanta ve nane gibi kokulu bitkilerdir",
  "Bitki köklerinin sağlığını kontrol etmek için ara sıra saksıdan çıkarın"
];

const getRandomGardenTip = () => {
  return gardenTips[Math.floor(Math.random() * gardenTips.length)];
};

// Dynamic import için tip tanımları
interface PDFFlipBookProps {
  pdfUrl: string;
  title: string;
  className?: string;
  showControls?: boolean;
  onPageCountChange?: (count: number) => void;
  onPageChange?: (page: number) => void;
}

// Component için sabit bir tip seç
const staticGardenTip = gardenTips[2];

// Loading component
const PDFFlipbookLoading = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <Sprout className="h-8 w-8 mx-auto mb-4 text-green-600" />
        <p className="text-lg font-medium text-gray-800 mb-2">Bahçe İpucu</p>
        <p className="text-gray-600 text-sm leading-relaxed">{staticGardenTip}</p>
        <p className="text-xs text-gray-500 mt-3">PDF Flipbook yükleniyor...</p>
      </div>
    </div>
  );
};

// Dynamic import with lazy loading
const PDFFlipbook = dynamic(
  () => import('./PDFFlipbook'),
  {
    loading: PDFFlipbookLoading,
    ssr: false
  }
);

const LazyPDFFlipbook = forwardRef<any, PDFFlipBookProps>((props, ref) => {
  return <PDFFlipbook ref={ref} {...props} />;
});

LazyPDFFlipbook.displayName = 'LazyPDFFlipbook';

export default LazyPDFFlipbook;