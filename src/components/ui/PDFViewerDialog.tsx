'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type { Catalog } from '@/types';

// Dynamic import for ResponsivePDFViewer with loading
const ResponsivePDFViewer = dynamic(
  () => import('@/components/ui/ResponsivePDFViewer'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[500px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">PDF görüntüleyici yükleniyor...</p>
          <p className="text-sm text-gray-500 mt-1">Bu işlem birkaç saniye sürebilir</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: Catalog;
}

export default function PDFViewerDialog({ open, onOpenChange, catalog }: PDFViewerDialogProps) {
  const [currentPageCount, setCurrentPageCount] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Download PDF
  const downloadPDF = () => {
    const link = document.createElement('a');
    // Firebase Storage URL'leri için proxy kullan
    const downloadUrl = catalog.pdfUrl.includes('firebasestorage.googleapis.com') 
      ? `/api/pdf-proxy?url=${encodeURIComponent(catalog.pdfUrl)}`
      : catalog.pdfUrl;
    link.href = downloadUrl;
    link.download = `${catalog.title}.pdf`;
    link.click();
  };

  // Share functionality
  const shareCatalog = async () => {
    const shareData = {
      title: catalog.title,
      text: `${catalog.brand} - ${catalog.title}`,
      url: `${window.location.origin}/catalogs/${catalog.slug}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/catalogs/${catalog.slug}`);
        alert('Link panoya kopyalandı!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Custom overlay with blur effect */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Custom content with iPhone-style animations */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              "relative bg-white rounded-3xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-75 data-[state=open]:zoom-in-100",
              "data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2",
              "duration-300 ease-out",
              // Mobile: full screen with bottom slide animation
              "sm:rounded-3xl sm:max-h-[95vh] sm:m-4",
              "max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:h-full max-sm:max-h-none max-sm:m-0"
            )}
            style={{
              // Custom CSS for iPhone-style spring animation
              transformOrigin: 'center bottom',
            }}
            data-state={open ? 'open' : 'closed'}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm sticky top-0 z-10 rounded-t-3xl">
              <div className="flex-1">
                <h2 className="text-lg font-semibold truncate">{catalog.title}</h2>
                <p className="text-sm text-muted-foreground">{catalog.brand}</p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {/* Share button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareCatalog}
                  className="hidden sm:flex"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {/* Download button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadPDF}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-4 h-[calc(100%-80px)] overflow-hidden">
              <div className="h-full w-full bg-gray-50 rounded-2xl overflow-hidden">
                <ResponsivePDFViewer
                  pdfUrl={catalog.pdfUrl}
                  title={catalog.title}
                  onPageCountChange={setCurrentPageCount}
                  className="h-full w-full"
                />
              </div>
            </div>

            {/* Mobile action buttons */}
            <div className="sm:hidden flex justify-center gap-4 p-4 bg-white border-t">
              <Button variant="outline" onClick={shareCatalog} className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Paylaş
              </Button>
              <Button onClick={downloadPDF} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                İndir
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}