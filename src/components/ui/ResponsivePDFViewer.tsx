'use client';

import { useState, useEffect } from 'react';
import PDFFlipBook from './PDFFlipbook';
import MobilePDFViewer from './MobilePDFViewer';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface ResponsivePDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  onPageCountChange?: (count: number) => void;
}

const ResponsivePDFViewer: React.FC<ResponsivePDFViewerProps> = ({
  pdfUrl,
  title,
  className,
  onPageCountChange
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
    };
    
    // Initial check
    checkMobile();
    setIsLoaded(true);
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Retry function
  const handleRetry = () => {
    setHasError(false);
    setRetryKey(prev => prev + 1);
  };

  // Error handler
  const handleError = () => {
    setHasError(true);
  };

  // Don't render until we know the screen size to prevent hydration mismatch
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">PDF viewer yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-red-200 rounded-lg bg-red-50">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">PDF viewer yüklenirken hata oluştu.</p>
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} key={retryKey}>
      {isMobile ? (
        // Mobile: Use React-PDF based viewer
        <MobilePDFViewer
          pdfUrl={pdfUrl}
          title={title}
          className="h-[calc(100vh-120px)] min-h-[500px] w-full"
          onPageCountChange={onPageCountChange}
        />
      ) : (
        // Desktop: Use existing flipbook
        <PDFFlipBook
          pdfUrl={pdfUrl}
          title={title}
          className="h-[calc(100vh-200px)] min-h-[500px] w-full"
          onPageCountChange={onPageCountChange}
        />
      )}
    </div>
  );
};

export default ResponsivePDFViewer;