"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { smartBulkImport } from '@/lib/actions/productActions';

// Lazy load components
const LazyTemplateDownloader = dynamic(() => import('@/components/admin/import/LazyTemplateDownloader'), { ssr: false });
const LazyFileUploader = dynamic(() => import('@/components/admin/import/LazyFileUploader'), { ssr: false });
const LazyExcelProcessor = dynamic(() => import('@/components/admin/import/LazyExcelProcessor'), { ssr: false });

interface ExcelProduct {
  İsim: string;
  Açıklama: string;
  SKU?: string;
  Marka?: string;
  Kategoriler: string;
  'Resim URL': string;
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ExcelProduct[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shouldProcessFile, setShouldProcessFile] = useState(false);
  const [results, setResults] = useState<{ 
    created: number; 
    updated: number; 
    skipped: number; 
    errors: string[] 
  }>({
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  });
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setShouldProcessFile(true);
  };

  const handleProductsLoaded = (loadedProducts: ExcelProduct[]) => {
    setProducts(loadedProducts);
    setShouldProcessFile(false);
    toast({
      title: 'Excel Dosyası Yüklendi',
      description: `${loadedProducts.length} ürün bulundu`,
    });
  };

  const handleProcessingError = (error: string) => {
    setShouldProcessFile(false);
    toast({
      title: 'Hata!',
      description: error,
      variant: 'destructive'
    });
  };

  const processImport = async () => {
    if (products.length === 0) {
      toast({
        title: 'Hata!',
        description: 'Önce Excel dosyası yükleyin',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults({ created: 0, updated: 0, skipped: 0, errors: [] });

    try {
      // Excel verilerini plain object'e dönüştür
      const plainProducts = products.map(product => ({
        İsim: String(product.İsim || ''),
        Açıklama: String(product.Açıklama || ''),
        SKU: product.SKU ? String(product.SKU) : undefined,
        Marka: product.Marka ? String(product.Marka) : undefined,
        Kategoriler: String(product.Kategoriler || ''),
        'Resim URL': String(product['Resim URL'] || '')
      }));
      
      // Progress simulation - ürün sayısına göre tahmini süre
      const totalProducts = plainProducts.length;
      const estimatedTimeMs = Math.max(2000, totalProducts * 100); // Minimum 2 saniye, ürün başına 100ms
      const updateInterval = Math.max(100, estimatedTimeMs / 50); // 50 update yapacak
      
      // Progress bar animasyonu başlat
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + (90 / (estimatedTimeMs / updateInterval));
          return Math.min(nextProgress, 90); // Maximum %90'a kadar, son %10'u işlem bitince
        });
      }, updateInterval);
      
      const result = await smartBulkImport(plainProducts);
      
      // Progress interval'ı temizle ve %100'e set et
      clearInterval(progressInterval);
      setProgress(100);
      
      setResults(result);
      
      toast({
        title: 'İşlem Tamamlandı',
        description: `${result.created} yeni ürün eklendi, ${result.updated} ürün güncellendi, ${result.skipped} ürün atlandı`,
        variant: result.created > 0 || result.updated > 0 ? 'default' : 'destructive'
      });
    } catch (error) {
      // Hata durumunda progress interval'ı temizle
      setProgress(0);
      
      toast({
        title: 'Hata!',
        description: 'İçe aktarma işlemi başarısız',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 bg-admin-background min-h-screen">
      <div className="mb-8 bg-admin-surface rounded-xl p-6 shadow-sm border border-admin-border">
        <h1 className="text-3xl font-bold mb-2 text-admin-text-primary">Akıllı Toplu Ürün İçe Aktarma</h1>
        <p className="text-admin-text-secondary">
          Excel dosyası ile yeni ürünler ekleyin ve mevcut ürünlerin eksik bilgilerini tamamlayın
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Akıllı Özellikler:</strong> Aynı isimde ürünler tekrar eklenmez. Mevcut ürünlerin eksik bilgileri tamamlanır. Kategoriler otomatik oluşturulur.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            <strong>Kategoriler:</strong> Excel'de kategori ismi yazın (örn: "Elektronik"), sistem otomatik olarak kategoriyi oluşturacak veya mevcut olanı kullanacak.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Template Download */}
        <Card className="bg-admin-surface border-admin-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-admin-text-primary">
              <Download className="h-5 w-5 text-admin-primary" />
              Şablon İndir
            </CardTitle>
            <CardDescription className="text-admin-text-secondary">
              Excel şablonunu indirip ürün bilgilerini doldurun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LazyTemplateDownloader />
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="bg-admin-surface border-admin-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-admin-text-primary">
              <Upload className="h-5 w-5 text-admin-primary" />
              Excel Dosyası Yükle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LazyFileUploader onFileSelected={handleFileSelected} />

            {file && (
              <div className="mt-4 p-4 bg-admin-muted rounded-lg border border-admin-border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-admin-primary" />
                  <span className="font-medium text-admin-text-primary">{file.name}</span>
                  <Badge variant="secondary" className="bg-admin-primary/10 text-admin-primary">{products.length} ürün</Badge>
                </div>
              </div>
            )}

            {/* Lazy Excel Processor */}
            {shouldProcessFile && file && (
              <LazyExcelProcessor
                file={file}
                onProductsLoaded={handleProductsLoaded}
                onError={handleProcessingError}
              />
            )}
          </CardContent>
        </Card>

        {/* Import Controls */}
        {products.length > 0 && (
          <Card className="bg-admin-surface border-admin-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-admin-text-primary">Akıllı İçe Aktarma</CardTitle>
              <CardDescription className="text-admin-text-secondary">
                {products.length} ürün analiz edilecek - Yeni ürünler eklenecek, mevcut ürünler güncellenecek
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={processImport} 
                disabled={processing}
                className="w-full bg-admin-primary hover:bg-admin-primary/90 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Akıllı İçe Aktarma Başlat
                  </>
                )}
              </Button>

              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-admin-text-secondary">
                    <span>İlerleme</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="bg-admin-muted" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {(results.created > 0 || results.updated > 0 || results.skipped > 0 || results.errors.length > 0) && (
          <Card className="bg-admin-surface border-admin-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-admin-text-primary">Sonuçlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Yeni: {results.created}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Güncellenen: {results.updated}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Atlanan: {results.skipped}</span>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-admin-text-primary">Hatalar:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 