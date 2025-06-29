'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import için tip tanımları
interface MobilePDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  showControls?: boolean;
  onPageCountChange?: (count: number) => void;
}

// Loading component
const MobilePDFViewerLoading = () => (
  <div className="flex items-center justify-center min-h-[500px] bg-gray-50 rounded-lg border">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">PDF Viewer yükleniyor...</p>
      <p className="text-sm text-gray-500 mt-1">PDF kütüphanesi yükleniyor...</p>
    </div>
  </div>
);

// Dynamic import with lazy loading
const MobilePDFViewer = dynamic(
  () => import('./MobilePDFViewer'),
  {
    loading: MobilePDFViewerLoading,
    ssr: false
  }
);

const LazyMobilePDFViewer: React.FC<MobilePDFViewerProps> = (props) => {
  return <MobilePDFViewer {...props} />;
};

export default LazyMobilePDFViewer;