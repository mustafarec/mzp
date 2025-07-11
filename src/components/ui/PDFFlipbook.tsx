'use client';

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download,
  ExternalLink,
  Maximize,
  Minimize,
  Loader2,
  RefreshCw,
  X,
  Sprout
} from 'lucide-react';
import { convertPDFWithCache, type PDFPageData, type PDFConversionOptions } from '@/lib/pdfUtils';

// Bahçe ipuçları
const gardenTips = [
  "Toprak nem seviyesini kontrol etmek için parmağınızı toprağa sokun",
  "Bitki hastalıkları genellikle nem ve hava sirkulâsyonu eksikliğinden kaynaklanır",
  "Doğal gübre için muz kabuğu ve yumurta kabuğu kullanabilirsiniz",
  "Asidosever bitkiler için kahve telvesini toprağa karıştırın",
  "Bitkilerin dinlenme dönemlerini tanıyın ve ona göre bakım yapın",
  "Sera gazlarını azaltmak için yerel ve mevsimlik bitkiler tercih edin",
  "Bal arısı dostu çiçekler ekosisteme katkı sağlar",
  "Permakültür prensipleri ile sürdürülebilir bahçe oluşturun",
  "Doğal avı böcekleri barındırmak için çeşitli bitkiler yetiirin",
  "Tohum saklama tekniklerini öğrenerek kendi tohum bankanızı oluşturun"
];

const getRandomGardenTip = () => {
  return gardenTips[Math.floor(Math.random() * gardenTips.length)];
};
import { cn } from '@/lib/utils';

interface PDFPage {
  pageNumber: number;
  imageData: string;
  width: number;
  height: number;
}

interface PDFFlipBookProps {
  pdfUrl: string;
  title: string;
  className?: string;
  showControls?: boolean;
  onPageCountChange?: (count: number) => void;
  onPageChange?: (page: number) => void;
}

const FlipBookPage = React.forwardRef<HTMLDivElement, { page: PDFPage }>(
  ({ page }, ref) => {
    return (
      <div ref={ref} className="w-full h-full shadow-lg overflow-hidden">
        <img
          src={page.imageData}
          alt={`Sayfa ${page.pageNumber}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {/* Sayfa numarası overlay */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
            {page.pageNumber}
          </span>
        </div>
      </div>
    );
  }
);

FlipBookPage.displayName = 'FlipBookPage';

const PDFFlipBook = forwardRef<any, PDFFlipBookProps>(({ 
  pdfUrl, 
  title, 
  className = '', 
  showControls = true,
  onPageCountChange,
  onPageChange
}, ref) => {
  const book = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreenCurrentPage, setFullscreenCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerSpacing, setContainerSpacing] = useState({ padding: 16, gap: 12 });
  const [pdfPosition, setPdfPosition] = useState({ paddingLeft: 80, translateX: 60 });
  const [fullscreenPosition, setFullscreenPosition] = useState({ paddingLeft: 120, translateX: 100 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gardenTip] = useState<string>(getRandomGardenTip());

  // Expose control functions via ref
  useImperativeHandle(ref, () => ({
    nextPage,
    prevPage,
    toggleFullscreen
  }));

  // Fixed responsive dimensions for stable flipbook
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window === 'undefined') return;
      
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Update container spacing dynamically
      const dynamicPadding = Math.max(8, Math.min(24, 320 / (window.innerWidth * 0.01)));
      const dynamicGap = Math.max(4, Math.min(12, 160 / (window.innerWidth * 0.01)));
      setContainerSpacing({ padding: dynamicPadding, gap: dynamicGap });
      
      // Update PDF position values for normal mode
      const paddingLeft = Math.min(80, window.innerWidth * 0.05);
      const translateX = Math.min(60, window.innerWidth * 0.04);
      setPdfPosition({ paddingLeft, translateX });
      
      // Update PDF position values for fullscreen mode
      const fullscreenPaddingLeft = Math.min(120, window.innerWidth * 0.08);
      const fullscreenTranslateX = Math.min(100, window.innerWidth * 0.06);
      setFullscreenPosition({ paddingLeft: fullscreenPaddingLeft, translateX: fullscreenTranslateX });
      
      if (isFullscreen) {
        // Fullscreen mode - larger fixed dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        const maxWidth = Math.floor(screenWidth * 0.4 * zoomLevel);
        const maxHeight = Math.floor(screenHeight * 0.8 * zoomLevel);
        
        // Maintain aspect ratio
        const aspectRatio = 0.7;
        const calcWidth = Math.floor(maxHeight * aspectRatio);
        const finalWidth = Math.min(calcWidth, maxWidth);
        const finalHeight = Math.floor(finalWidth / aspectRatio);
        
        setDimensions({
          width: finalWidth,
          height: finalHeight
        });
      } else {
        // Normal mode - smaller fixed dimensions
        if (isMobileDevice) {
          setDimensions({ width: 120, height: 170 });
        } else {
          setDimensions({ width: 300, height: 430 });
        }
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isFullscreen, zoomLevel]);

  // Convert PDF to images using centralized caching system
  const convertPDFToImages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setLoadProgress(0);

      // Use centralized PDF conversion with caching
      const options: PDFConversionOptions = {
        scale: 1.5,
        quality: 0.8,
        onProgress: (progress, pageNumber) => {
          const newProgress = Math.round(progress * 0.95); // Up to 95%
          setLoadProgress(prev => Math.max(prev, newProgress));
        }
      };

      // Use CORS proxy for Firebase Storage URLs
      const proxyUrl = pdfUrl.includes('firebasestorage.googleapis.com') 
        ? `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`
        : pdfUrl;

      const convertedPages = await convertPDFWithCache(proxyUrl, options);
      
      // Convert PDFPageData to our local PDFPage format
      const pages: PDFPage[] = convertedPages.map(page => ({
        pageNumber: page.pageNumber,
        imageData: page.imageData,
        width: page.width,
        height: page.height
      }));

      // Final processing
      setLoadProgress(prev => Math.max(prev, 98));
      setPages(pages);
      setTotalPages(pages.length);
      onPageCountChange?.(pages.length);
      setLoadProgress(100);
      setLoading(false);
    } catch (err) {
      console.error('PDF conversion error:', err);
      setError('PDF dosyası yüklenemedi. Lütfen tekrar deneyin.');
      setLoading(false);
      setLoadProgress(0);
    }
  }, [pdfUrl, onPageCountChange]);

  useEffect(() => {
    if (pdfUrl) {
      convertPDFToImages();
    }
  }, [pdfUrl, convertPDFToImages]);

  // Navigation functions
  const nextPage = () => {
    const currentPageToCheck = isFullscreen ? fullscreenCurrentPage : currentPage;
    if (currentPageToCheck < totalPages - 1) {
      try {
        // Try different method calls for react-pageflip
        if (book.current?.getPageFlip) {
          book.current.getPageFlip().flipNext();
        } else if (book.current?.flipNext) {
          book.current.flipNext();
        } else if (book.current?.pageFlip) {
          book.current.pageFlip().flipNext();
        }
      } catch (error) {
        console.error('Error in flipNext:', error);
        // Fallback: manually increment page
        if (isFullscreen) {
          setFullscreenCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
        } else {
          setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
        }
      }
    }
  };
  
  const prevPage = () => {
    const currentPageToCheck = isFullscreen ? fullscreenCurrentPage : currentPage;
    if (currentPageToCheck > 0) {
      try {
        // Try different method calls for react-pageflip
        if (book.current?.getPageFlip) {
          book.current.getPageFlip().flipPrev();
        } else if (book.current?.flipPrev) {
          book.current.flipPrev();
        } else if (book.current?.pageFlip) {
          book.current.pageFlip().flipPrev();
        }
      } catch (error) {
        console.error('Error in flipPrev:', error);
        // Fallback: manually decrement page
        if (isFullscreen) {
          setFullscreenCurrentPage(prev => Math.max(prev - 1, 0));
        } else {
          setCurrentPage(prev => Math.max(prev - 1, 0));
        }
      }
    }
  };

  // Download PDF
  const downloadPDF = () => {
    const link = document.createElement('a');
    // Firebase Storage URL'leri için proxy kullan
    const downloadUrl = pdfUrl.includes('firebasestorage.googleapis.com') 
      ? `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`
      : pdfUrl;
    link.href = downloadUrl;
    link.download = `${title}.pdf`;
    link.click();
  };

  // Open in new tab
  const openInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  // Fullscreen functions
  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Normal moda geçerken fullscreen sayfasını normal moda sync et
      setCurrentPage(fullscreenCurrentPage);
      setZoomLevel(1);
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    } else {
      // Tam ekran moduna geçerken normal sayfayı fullscreen moda sync et
      setFullscreenCurrentPage(currentPage);
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
      setZoomLevel(2); // %200 zoom ile başla
    }
  };

  // Zoom functions for fullscreen
  const handleWheel = (e: React.WheelEvent) => {
    if (!isFullscreen) return;
    
    e.preventDefault();
    const zoomStep = 0.1; // %10'luk adımlar
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.min(Math.max(0.5, zoomLevel + delta), 3);
    setZoomLevel(Math.round(newZoom * 10) / 10); // 1 decimal precision
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      if (!isCurrentlyFullscreen && isFullscreen) {
        // Kullanıcı ESC ile çıktı
        setCurrentPage(fullscreenCurrentPage);
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, fullscreenCurrentPage]);

  // Retry function
  const retryLoad = () => {
    setError('');
    convertPDFToImages();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-red-200 rounded-lg bg-red-50">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={retryLoad}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
            
            <Button onClick={openInNewTab} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Yeni Sekmede Aç
            </Button>
            
            <Button onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Sprout className="h-8 w-8 mx-auto mb-4 text-green-600" />
          <p className="text-lg font-medium text-gray-800 mb-2">Bahçe İpucu</p>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{gardenTip}</p>
          <p className="text-gray-600 mb-2 text-sm">{title} yükleniyor...</p>
          <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto mb-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">%{loadProgress} tamamlandı</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative rounded-lg overflow-hidden',
        isFullscreen 
          ? 'fixed inset-0 z-[9999] bg-transparent w-screen h-screen'
          : 'flex h-full bg-white',
        className
      )}
    >

      {/* FlipBook */}
      {isFullscreen ? (
        /* FULLSCREEN MODE */
        <div 
          className="w-full h-full flex items-center justify-center relative"
          onWheel={handleWheel}
          style={{ 
            background: 'rgba(0, 0, 0, 0.9)',
          }}
        >
          <div 
            className="flex items-center justify-center w-full h-full transition-all duration-300 ease-in-out"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center'
            }}
          >
            <HTMLFlipBook
              ref={book}
              className="catalog-flipbook shadow-2xl"
              style={{ 
                margin: '0 auto',
                filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.6))`
              }}
              width={dimensions.width}
              height={dimensions.height}
              startPage={0}
              size="fixed"
              minWidth={dimensions.width}
              maxWidth={dimensions.width}
              minHeight={dimensions.height}
              maxHeight={dimensions.height}
              showCover={true}
              onInit={(e: any) => {
                const pageCount = e?.object?.getPageCount?.() || pages.length || 0;
                setTotalPages(pageCount);
              }}
              onFlip={(e: any) => {
                const pageNum = typeof e?.data === 'number' ? e.data : 0;
                setFullscreenCurrentPage(pageNum);
              }}
              drawShadow={true}
              flippingTime={600}
              usePortrait={false}
              maxShadowOpacity={0.4}
              startZIndex={100}
              autoSize={false}
              mobileScrollSupport={false}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              {pages.map((page) => (
                <FlipBookPage 
                  key={page.pageNumber} 
                  page={page}
                />
              ))}
            </HTMLFlipBook>
          </div>
          
          {/* Navigation Controls - Bottom Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-4 z-30">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevPage} 
                disabled={fullscreenCurrentPage === 0}
                className="bg-white/90 hover:bg-white text-black border-white/50"
              >
                <ChevronLeft className="w-4 h-4" /> 
                Önceki
              </Button>
              
              <div className="text-sm text-white font-medium bg-white/20 px-3 py-1 rounded-md">
                {fullscreenCurrentPage + 1} / {totalPages}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextPage} 
                disabled={fullscreenCurrentPage >= totalPages - 1}
                className="bg-white/90 hover:bg-white text-black border-white/50"
              >
                Sonraki 
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Close Button - Top Left */}
          <div className="absolute top-6 left-6 z-30">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white text-red-600 hover:text-red-700 transition-all duration-200"
              title="Tam Ekrandan Çık"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Zoom Indicator */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 z-30">
            <div className="text-sm text-white font-medium">
              %{Math.round(zoomLevel * 100)}
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL MODE */
        <div 
          ref={pdfContainerRef}
          className="flex h-full relative"
          style={{ 
            padding: containerSpacing.padding,
            gap: containerSpacing.gap
          }}
        >
          {/* PDF Container - Full Width */}
          <div className="flex-1 flex items-center justify-center relative">
            

            <HTMLFlipBook
              ref={book}
              className="catalog-flipbook shadow-lg"
              style={{ 
                margin: '0 auto',
                transform: 'translateX(0)'
              }}
              width={dimensions.width}
              height={dimensions.height}
              startPage={0}
              size="fixed"
              minWidth={dimensions.width}
              maxWidth={dimensions.width}
              minHeight={dimensions.height}
              maxHeight={dimensions.height}
              showCover={true}
              onInit={(e: any) => {
                const pageCount = e?.object?.getPageCount?.() || pages.length || 0;
                setTotalPages(pageCount);
              }}
              onFlip={(e: any) => {
                const pageNum = typeof e?.data === 'number' ? e.data : 0;
                setCurrentPage(pageNum);
                onPageChange?.(pageNum);
              }}
              drawShadow={true}
              flippingTime={600}
              usePortrait={false}
              maxShadowOpacity={0.4}
              startZIndex={100}
              autoSize={false}
              mobileScrollSupport={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              {pages.map((page) => (
                <FlipBookPage 
                  key={page.pageNumber} 
                  page={page}
                />
              ))}
            </HTMLFlipBook>
          </div>
        </div>
      )}
    </div>
  );
});

PDFFlipBook.displayName = 'PDFFlipBook';

export default PDFFlipBook;