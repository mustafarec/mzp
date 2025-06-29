'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernPDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  showControls?: boolean;
  autoHeight?: boolean;
}

const ModernPDFViewer = ({ 
  pdfUrl, 
  title, 
  className = '', 
  showControls = true,
  autoHeight = false 
}: ModernPDFViewerProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [loadMethod] = useState<'iframe'>('iframe'); // Simplified to iframe only
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLIFrameElement>(null);
  const maxRetries = 2; // Reduced retries

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle PDF load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError('');
  }, []);

  // Handle PDF load error - simplified
  const handleError = useCallback(() => {
    console.error('PDF load error. Retry count:', retryCount);
    
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setError('');
      }, 1000);
    } else {
      setError('PDF dosyası yüklenemedi. Lütfen dosyayı doğrudan indirip açın.');
      setIsLoading(false);
    }
  }, [retryCount, maxRetries]);

  // Manual retry function
  const retryLoad = () => {
    setRetryCount(0);
    setError('');
    setIsLoading(true);
  };

  // Download PDF
  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
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

  // Render PDF viewer - simplified iframe only
  const renderPDFViewer = () => {
    const pdfUrlWithViewer = `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH&zoom=page-fit`;

    return (
      <iframe
        ref={viewerRef}
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full border-0"
        title={title}
        src={pdfUrlWithViewer}
        allow="fullscreen"
        style={{ height: '100%', minHeight: isMobile ? '300px' : '400px' }}
      />
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-red-200 rounded-lg bg-red-50">
        <div className="text-center p-6">
          <p className="text-red-600 mb-4">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={retryLoad}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
            
            <Button 
              onClick={openInNewTab}
              variant="outline"
            >
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
        'relative bg-gray-100 rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 bg-black',
        className
      )}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">PDF yükleniyor...</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={downloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              İndir
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && !isLoading && (
        <div className="absolute top-2 left-2 right-2 z-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs hidden sm:block">
              {title.length > 20 ? `${title.substring(0, 20)}...` : title}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
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

      {/* PDF Viewer */}
      <div className="w-full h-full">
        {renderPDFViewer()}
      </div>

    </div>
  );
};

export default ModernPDFViewer;