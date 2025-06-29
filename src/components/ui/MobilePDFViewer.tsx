'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
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
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import React-PDF CSS
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MobilePDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  showControls?: boolean;
  onPageCountChange?: (count: number) => void;
}

const MobilePDFViewer: React.FC<MobilePDFViewerProps> = ({ 
  pdfUrl, 
  title, 
  className = '', 
  showControls = true,
  onPageCountChange
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Check if mobile device and set responsive width
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Set responsive page width
      if (mobile) {
        setPageWidth(window.innerWidth - 32); // 16px padding on each side
      } else {
        setPageWidth(Math.min(window.innerWidth * 0.7, 800)); // 70% of screen width, max 800px
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isFullscreen]);

  // Handle successful PDF load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
    onPageCountChange?.(numPages);
  }, [onPageCountChange]);

  // Handle PDF load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    
    // More specific error messages based on error type
    let errorMessage = 'PDF dosyası yüklenemedi. Lütfen tekrar deneyin.';
    
    if (error.message.includes('Invalid PDF structure')) {
      errorMessage = 'PDF dosyası bozuk görünüyor. Lütfen dosyayı kontrol edin.';
    } else if (error.message.includes('Loading')) {
      errorMessage = 'PDF dosyası yüklenirken ağ hatası oluştu. İnternet bağlantınızı kontrol edin.';
    } else if (error.message.includes('cors') || error.message.includes('CORS')) {
      errorMessage = 'PDF dosyasına erişim sorunu. Farklı bir yöntem deneyin.';
    }
    
    setError(errorMessage);
    setLoading(false);
  }, []);

  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const goToPage = (page: number) => {
    setPageNumber(Math.max(1, Math.min(page, numPages)));
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Retry function
  const retryLoad = () => {
    setError('');
    setLoading(true);
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistance = useRef<number>(0);
  const lastPinchScale = useRef<number>(1);
  
  // Calculate distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - for swipe gestures
      const touch = e.touches[0];
      handleTouchStart.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      // Two touches - for pinch-to-zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchDistance.current = distance;
      lastPinchScale.current = scale;
      handleTouchStart.current = null; // Disable swipe when pinching
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Handle pinch-to-zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      
      if (initialPinchDistance.current > 0) {
        const scaleChange = currentDistance / initialPinchDistance.current;
        const newScale = Math.max(0.5, Math.min(3, lastPinchScale.current * scaleChange));
        setScale(newScale);
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All touches ended
      if (handleTouchStart.current) {
        // Single touch ended - check for swipe
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - handleTouchStart.current.x;
        const deltaY = touch.clientY - handleTouchStart.current.y;
        
        // Horizontal swipe detection (threshold: 50px)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          e.preventDefault();
          if (deltaX > 0) {
            // Swipe right - previous page
            goToPrevPage();
          } else {
            // Swipe left - next page
            goToNextPage();
          }
        }
      }
      
      // Reset touch state
      handleTouchStart.current = null;
      initialPinchDistance.current = 0;
    }
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

  return (
    <div 
      ref={containerRef}
      className={cn(
        'mobile-pdf-viewer relative bg-gray-50 rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 bg-black rounded-none',
        className
      )}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">PDF yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Header Controls */}
      {showControls && !loading && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            {/* Left side - Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="secondary" className="hidden sm:block">
                {title.length > 30 ? `${title.substring(0, 30)}...` : title}
              </Badge>
              <Badge variant="outline" className="sm:hidden">
                {title.length > 15 ? `${title.substring(0, 15)}...` : title}
              </Badge>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1">
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

      {/* Zoom Controls - Fixed position (Desktop only) */}
      {!loading && !isMobile && (
        <div className="zoom-controls absolute top-16 right-4 z-20 flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="touch-control h-8 w-8 p-0"
            title="Yakınlaştır"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="touch-control h-8 w-8 p-0"
            title="Uzaklaştır"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            className="touch-control h-8 w-8 p-0"
            title="Zoom Sıfırla"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <div className="text-xs text-center py-1 px-2 bg-black/20 rounded">
            {Math.round(scale * 100)}%
          </div>
        </div>
      )}
      
      {/* Mobile Zoom Indicator */}
      {!loading && isMobile && scale !== 1 && (
        <div className="absolute top-16 right-4 z-20 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* PDF Document */}
      <div 
        ref={documentRef}
        className={cn(
          'pdf-container flex flex-col items-center no-select',
          isFullscreen ? 'p-8 min-h-screen bg-black' : 'p-4 min-h-[500px]'
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Document
          file={pdfUrl.includes('firebasestorage.googleapis.com') 
            ? `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`
            : pdfUrl
          }
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={pageWidth}
            className={cn(
              'shadow-lg rounded-lg overflow-hidden mb-4',
              isFullscreen && 'shadow-2xl'
            )}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {/* Bottom Navigation */}
      {!loading && numPages > 0 && (
        <div className="sticky bottom-0 z-20 bg-white border-t border-gray-200 p-3">
          <div className="flex items-center justify-between">
            {/* Previous button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage} 
              disabled={pageNumber <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> 
              <span className="hidden sm:inline">Önceki</span>
            </Button>
            
            {/* Page indicator and direct input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page)) {
                    goToPage(page);
                  }
                }}
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-600">/ {numPages}</span>
            </div>
            
            {/* Next button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={pageNumber >= numPages}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Sonraki</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
              style={{ width: `${(pageNumber / numPages) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePDFViewer;