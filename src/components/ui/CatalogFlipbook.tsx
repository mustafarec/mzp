'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertPDFWithCache, type PDFPageData } from '@/lib/pdfUtils';
import type { Catalog } from '@/types';

interface PDFPage {
  pageNumber: number;
  imageData: string;
  width: number;
  height: number;
}

interface CatalogFlipbookProps {
  catalog: Catalog;
  className?: string;
  showControls?: boolean;
  autoLoad?: boolean;
  onPageChange?: (pageNumber: number) => void;
}

const FlipBookPage = React.forwardRef<HTMLDivElement, { page: PDFPage; catalog: Catalog }>(
  ({ page, catalog }, ref) => {
    return (
      <div ref={ref} className="w-full h-full bg-white shadow-lg overflow-hidden relative">
        <img
          src={page.imageData}
          alt={`${catalog.title} - Sayfa ${page.pageNumber}`}
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

const CatalogFlipbook: React.FC<CatalogFlipbookProps> = ({ 
  catalog, 
  className = '', 
  showControls = true,
  autoLoad = true,
  onPageChange
}) => {
  const book = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);
  
  // Zoom state management
  const [isZooming, setIsZooming] = useState(false);
  const [zoomControls, setZoomControls] = useState(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout>();

  // Fixed responsive dimensions for stable flipbook
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window === 'undefined') return;
      
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      if (isFullscreen) {
        // Fullscreen mode - larger fixed dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        const maxWidth = Math.floor(screenWidth * 0.35); // 35% of screen width per page
        const maxHeight = Math.floor(screenHeight * 0.8); // 80% of screen height
        
        // Maintain aspect ratio
        const aspectRatio = 0.7; // width/height ratio
        const calcWidth = Math.floor(maxHeight * aspectRatio);
        const finalWidth = Math.min(calcWidth, maxWidth);
        const finalHeight = Math.floor(finalWidth / aspectRatio);
        
        setDimensions({
          width: finalWidth,
          height: finalHeight
        });
      } else if (isMobileDevice) {
        setDimensions({ 
          width: 140, 
          height: 200 
        });
      } else {
        setDimensions({ 
          width: 350, 
          height: 500 
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  // Convert PDF to images using PDF.js
  const convertPDFToImages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setLoadProgress(0);

      // Use PDF.js with centralized worker initialization
      const { getPDFLib } = await import('@/lib/pdfWorker');
      const pdfjsLib = await getPDFLib();

      const pdf = await pdfjsLib.getDocument({
        url: catalog.pdfUrl,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      }).promise;

      const numPages = pdf.numPages;
      const convertedPages: PDFPage[] = [];

      // Convert each page to image
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setLoadProgress(Math.round((pageNum / numPages) * 80)); // %80'e kadar progress

        const page = await pdf.getPage(pageNum);
        const scale = 1.5; // Good quality for flipbook
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('Canvas 2D context creation failed for page', pageNum);
          continue; // Skip this page and continue with next
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        convertedPages.push({
          pageNumber: pageNum,
          imageData: canvas.toDataURL('image/jpeg', 0.8),
          width: viewport.width,
          height: viewport.height,
        });
      }

      setPages(convertedPages);
      setTotalPages(convertedPages.length);
      setLoadProgress(100);
      setLoading(false);
    } catch (err) {
      console.error('PDF conversion error:', err);
      setError('PDF dosyası yüklenemedi. Lütfen tekrar deneyin.');
      setLoading(false);
      setLoadProgress(0);
    }
  }, [catalog.pdfUrl]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && catalog.pdfUrl) {
      convertPDFToImages();
    }
  }, [catalog.pdfUrl, autoLoad, convertPDFToImages]);

  // Handle page change
  const handlePageChange = useCallback((e: any) => {
    setCurrentPage(e.data);
    if (onPageChange) {
      onPageChange(e.data);
    }
  }, [onPageChange]);
  
  // Zoom functions
  const handleZoomIn = () => {
    if (transformRef.current) {
      transformRef.current.zoomIn(0.2);
    }
  };
  
  const handleZoomOut = () => {
    if (transformRef.current) {
      transformRef.current.zoomOut(0.2);
    }
  };
  
  const handleResetZoom = () => {
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
  };
  
  const handleZoomStart = () => {
    setIsZooming(true);
    setZoomControls(true);
  };
  
  const handleZoomStop = () => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    zoomTimeoutRef.current = setTimeout(() => {
      setIsZooming(false);
      setZoomControls(false);
    }, 2000);
  };

  // Navigation functions
  const nextPage = () => book.current?.pageFlip()?.flipNext();
  const prevPage = () => book.current?.pageFlip()?.flipPrev();
  const goToPage = (pageNumber: number) => book.current?.pageFlip()?.flip(pageNumber);

  // Download PDF
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = catalog.pdfUrl;
    link.download = `${catalog.title}.pdf`;
    link.target = '_blank';
    link.click();
  };

  // Open in new tab
  const openInNewTab = () => {
    window.open(catalog.pdfUrl, '_blank');
  };

  // Fullscreen functions
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Manual load function
  const loadCatalog = () => {
    if (!loading) {
      convertPDFToImages();
    }
  };

  // Retry function
  const retryLoad = () => {
    setError('');
    convertPDFToImages();
  };

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px] border border-red-200 rounded-lg bg-red-50", className)}>
        <div className="text-center p-6">
          <BookOpen className="h-12 w-12 text-red-400 mx-auto mb-4" />
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

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 mb-2">
            {catalog.title} katalogu yükleniyor...
          </p>
          <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${loadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">%{loadProgress} tamamlandı</p>
          
          <div className="mt-4 flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not loaded state (when autoLoad is false)
  if (!autoLoad && pages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg", className)}>
        <div className="text-center p-6">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{catalog.title}</h3>
          <p className="text-gray-600 mb-4">
            Katalogu flipbook olarak görüntülemek için yükleyin
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={loadCatalog}>
              <BookOpen className="mr-2 h-4 w-4" />
              Flipbook Yükle
            </Button>
            <Button variant="outline" onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative bg-gray-100 rounded-lg overflow-hidden flex flex-col items-center',
        isFullscreen && 'fixed inset-0 z-50 bg-black',
        className
      )}
    >
      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {catalog.brand}
            </Badge>
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
              {catalog.title.length > 20 ? `${catalog.title.substring(0, 20)}...` : catalog.title}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow p-1">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  {isFullscreen ? 
                    <Minimize className="h-3 w-3" /> : 
                    <Maximize className="h-3 w-3" />
                  }
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadPDF}
                className="h-8 w-8 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FlipBook */}
      <div className="flex flex-col items-center py-12 w-full">
        <div className="relative max-w-full">
          <div className="flex justify-center mb-8">
            {isFullscreen ? (
              <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={0.5}
                maxScale={3}
                doubleClick={{ disabled: true }}
                wheel={{ step: 0.1 }}
                pinch={{ step: 10 }}
                panning={{ disabled: false }}
                onZoomStart={handleZoomStart}
                onZoomStop={handleZoomStop}
                onPanningStart={handleZoomStart}
                onPanningStop={handleZoomStop}
                centerOnInit={true}
              >
                <TransformComponent
                  wrapperClass="w-full h-full flex items-center justify-center"
                  contentClass="flex items-center justify-center"
                >
                  <HTMLFlipBook
                    ref={book}
                    className="catalog-flipbook shadow-2xl"
                    style={{ margin: '0 auto' }}
                    width={dimensions.width}
                    height={dimensions.height}
                    startPage={0}
                    size="fixed"
                    minWidth={dimensions.width}
                    maxWidth={dimensions.width}
                    minHeight={dimensions.height}
                    maxHeight={dimensions.height}
                    showCover={false}
                    onInit={(e: any) => setTotalPages(e.pages)}
                    onFlip={handlePageChange}
                    drawShadow={true}
                    flippingTime={isZooming ? 400 : 800}
                    usePortrait={false}
                    maxShadowOpacity={0.3}
                    startZIndex={100}
                    autoSize={false}
                    mobileScrollSupport={false}
                    clickEventForward={!isZooming}
                    useMouseEvents={!isZooming}
                    swipeDistance={50}
                    showPageCorners={true}
                    disableFlipByClick={isZooming}
                  >
                    {pages.map((page) => (
                      <FlipBookPage key={page.pageNumber} page={page} catalog={catalog} />
                    ))}
                  </HTMLFlipBook>
                </TransformComponent>
              </TransformWrapper>
            ) : (
              <HTMLFlipBook
                ref={book}
                className="catalog-flipbook shadow-2xl"
                style={{ margin: '0 auto' }}
                width={dimensions.width}
                height={dimensions.height}
                startPage={0}
                size="fixed"
                minWidth={dimensions.width}
                maxWidth={dimensions.width}
                minHeight={dimensions.height}
                maxHeight={dimensions.height}
                showCover={false}
                onInit={(e: any) => setTotalPages(e.pages)}
                onFlip={handlePageChange}
                drawShadow={true}
                flippingTime={800}
                usePortrait={false}
                maxShadowOpacity={0.3}
                startZIndex={100}
                autoSize={false}
                mobileScrollSupport={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={50}
                showPageCorners={true}
                disableFlipByClick={false}
              >
                {pages.map((page) => (
                  <FlipBookPage key={page.pageNumber} page={page} catalog={catalog} />
                ))}
              </HTMLFlipBook>
            )}
          </div>
          
          {/* Zoom Controls - Only in Fullscreen */}
          {isFullscreen && (
            <div className={cn(
              "absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-2 z-30 transition-opacity duration-300",
              zoomControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Yakınlaştır"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Uzaklaştır"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Zoom Sıfırla"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Sayfa {currentPage + 1} / {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevPage} 
                disabled={currentPage === 0 || (isFullscreen && isZooming)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> 
                Önceki
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextPage} 
                disabled={currentPage === totalPages - 1 || (isFullscreen && isZooming)}
              >
                Sonraki 
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Catalog Info */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {catalog.brand} • {catalog.fileSize ? `${Math.round(catalog.fileSize / 1024)} MB` : 'PDF'}
              {catalog.pageCount && ` • ${catalog.pageCount} sayfa`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogFlipbook;