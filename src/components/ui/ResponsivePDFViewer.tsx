'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import LazyPDFFlipbook from './LazyPDFFlipbook';
import LazyMobilePDFViewer from './LazyMobilePDFViewer';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { RefreshCw, Loader2, Sprout } from 'lucide-react';

// Bahçe ipuçları
const gardenTips = [
  "Bitki kökleri nefes alabilmesi için toprağı ara sıra gevşetin",
  "Yağmurlu havalarda dış bitkileri sulamaya gerek yoktur",
  "Zararlı böceklere karşı doğal çözümler tercih edin",
  "Bitkilerin büyüme mevsiminde daha sık gübreleme yapın",
  "Saksı bitkilerini yılda bir kez taze toprakla değiştirin",
  "Güneş seven bitkileri güney cepheli pencerelere yerlestirin",
  "Bitki budaması dinlenme döneminde yapılır, genellikle kış sonu",
  "Toprak pH değeri bitki sağlığı için çok önemlidir",
  "Sulama yaparken yapraklara değil köklere su verin",
  "İyi drenajı olan saksılar kök çürümesini önler"
];

const getRandomGardenTip = () => {
  return gardenTips[Math.floor(Math.random() * gardenTips.length)];
};

interface ResponsivePDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  onPageCountChange?: (count: number) => void;
  onPageChange?: (page: number) => void;
}

const ResponsivePDFViewer = forwardRef<any, ResponsivePDFViewerProps>(({
  pdfUrl,
  title,
  className,
  onPageCountChange,
  onPageChange
}, ref) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [gardenTip, setGardenTip] = useState<string>('');
  const flipbookRef = useRef<any>(null);

  // Expose control functions via ref
  useImperativeHandle(ref, () => ({
    nextPage: () => flipbookRef.current?.nextPage?.(),
    prevPage: () => flipbookRef.current?.prevPage?.(),
    toggleFullscreen: () => flipbookRef.current?.toggleFullscreen?.()
  }));

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
    };
    
    // Initial check
    checkMobile();
    setIsLoaded(true);
    
    // Set garden tip once on mount
    setGardenTip(getRandomGardenTip());
    
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
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Sprout className="h-8 w-8 mx-auto mb-4 text-green-600" />
          <p className="text-lg font-medium text-gray-800 mb-2">Bahçe İpucu</p>
          <p className="text-gray-600 text-sm leading-relaxed">{gardenTip || getRandomGardenTip()}</p>
          <p className="text-xs text-gray-500 mt-3">Cihaz türü belirleniyor...</p>
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
          ref={flipbookRef}
          pdfUrl={pdfUrl}
          title={title}
          className="h-[calc(100vh-200px)] min-h-[500px] w-full"
          onPageCountChange={onPageCountChange}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
});

ResponsivePDFViewer.displayName = 'ResponsivePDFViewer';

export default ResponsivePDFViewer;