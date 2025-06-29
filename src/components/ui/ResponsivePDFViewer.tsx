'use client';

import { useState, useEffect } from 'react';
import LazyPDFFlipbook from './LazyPDFFlipbook';
import LazyMobilePDFViewer from './LazyMobilePDFViewer';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { RefreshCw, Loader2 } from 'lucide-react';

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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">PDF viewer hazırlanıyor...</p>
          <p className="text-sm text-gray-500 mt-1">Cihaz türü belirleniyor</p>
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
        // Mobile: Use React-PDF based viewer (lazy loaded)
        <LazyMobilePDFViewer
          pdfUrl={pdfUrl}
          title={title}
          className="h-[calc(100vh-120px)] min-h-[500px] w-full"
          onPageCountChange={onPageCountChange}
        />
      ) : (
        // Desktop: Use existing flipbook (lazy loaded)
        <LazyPDFFlipbook
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