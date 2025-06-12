'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  BookOpen,
  Calendar,
  Building,
  Tag,
  Loader2
} from 'lucide-react';
import { getCatalogBySlug } from '@/lib/actions/catalogActions';
import PDFFlipBook from '@/components/ui/PDFFlipbook';
import type { Catalog } from '@/types';

export default function CatalogDetailPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPageCount, setCurrentPageCount] = useState<number | null>(null);
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Load catalog
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setError('');
        
        const catalogData = await getCatalogBySlug(slug);
        
        if (!catalogData) {
          setError('Katalog bulunamadı');
          return;
        }
        
        setCatalog(catalogData);
      } catch (error) {
        console.error('Error loading catalog:', error);
        setError('Katalog yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCatalog();
    }
  }, [slug]);

  // Download PDF
  const downloadPDF = () => {
    if (catalog) {
      const link = document.createElement('a');
      // Firebase Storage URL'leri için proxy kullan
      const downloadUrl = catalog.pdfUrl.includes('firebasestorage.googleapis.com') 
        ? `/api/pdf-proxy?url=${encodeURIComponent(catalog.pdfUrl)}`
        : catalog.pdfUrl;
      link.href = downloadUrl;
      link.download = `${catalog.title}.pdf`;
      link.click();
    }
  };

  // Share functionality
  const shareCatalog = async () => {
    if (!catalog) return;
    
    const shareData = {
      title: catalog.title,
      text: `${catalog.brand} - ${catalog.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast here
        alert('Link panoya kopyalandı!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Format file size
  const formatFileSize = (sizeInKB: number): string => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    }
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Katalog yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Katalog Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Aradığınız katalog mevcut değil veya kaldırılmış olabilir.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri Dön
              </Button>
              <Button variant="outline" asChild>
                <Link href="/catalogs">
                  Tüm Kataloglar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{catalog.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{catalog.brand}</Badge>
                  {catalog.category && (
                    <Badge variant="outline">{catalog.category}</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={shareCatalog}>
                <Share2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Paylaş</span>
              </Button>
              <Button onClick={downloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">İndir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-4">
          {/* PDF Viewer */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card className="overflow-visible">
              <CardContent className="p-0">
                <PDFFlipBook
                  pdfUrl={catalog.pdfUrl}
                  title={catalog.title}
                  className="h-[calc(100vh-200px)] min-h-[500px] w-full"
                  onPageCountChange={setCurrentPageCount}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="space-y-4">
              {/* Catalog Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Katalog Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Marka</span>
                      <span className="font-medium">{catalog.brand}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dosya Boyutu</span>
                      <span className="font-medium">{formatFileSize(catalog.fileSize)}</span>
                    </div>
                    
                    {currentPageCount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sayfa Sayısı</span>
                        <span className="font-medium">{currentPageCount}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Yayın Tarihi</span>
                      <span className="font-medium">{formatDate(catalog.createdAt)}</span>
                    </div>
                  </div>

                  <Separator />

                  <Button 
                    onClick={downloadPDF} 
                    className="w-full"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF İndir
                  </Button>
                </CardContent>
              </Card>

              {/* Description */}
              {catalog.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Açıklama</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {catalog.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Share Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Paylaş</CardTitle>
                  <CardDescription>
                    Bu katalogu arkadaşlarınızla paylaşın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    onClick={shareCatalog}
                    className="w-full"
                    size="sm"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Bağlantıyı Paylaş
                  </Button>
                </CardContent>
              </Card>

              {/* All Catalogs Link */}
              <Card>
                <CardContent className="pt-6">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/catalogs">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Tüm Kataloglar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}