'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import için tip tanımları
interface PDFFlipBookProps {
  pdfUrl: string;
  title: string;
  className?: string;
  showControls?: boolean;
  onPageCountChange?: (count: number) => void;
}

// Loading component
const PDFFlipbookLoading = () => (
  <div className="flex items-center justify-center min-h-[500px] bg-gray-50 rounded-lg border">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">PDF Flipbook yükleniyor...</p>
      <p className="text-sm text-gray-500 mt-1">İlk yüklemede biraz zaman alabilir</p>
    </div>
  </div>
);

// Dynamic import with lazy loading
const PDFFlipbook = dynamic(
  () => import('./PDFFlipbook'),
  {
    loading: PDFFlipbookLoading,
    ssr: false
  }
);

const LazyPDFFlipbook: React.FC<PDFFlipBookProps> = (props) => {
  return <PDFFlipbook {...props} />;
};

export default LazyPDFFlipbook;