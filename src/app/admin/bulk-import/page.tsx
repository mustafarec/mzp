"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import { generateSlug } from '@/lib/utils';
import { createProduct, smartBulkImport } from '@/lib/actions/productActions';

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

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelProduct[];
        
        setProducts(jsonData);
        toast({
          title: 'Excel Dosyası Yüklendi',
          description: `${jsonData.length} ürün bulundu`,
        });
      } catch (error) {
        toast({
          title: 'Hata!',
          description: 'Excel dosyası okunamadı',
          variant: 'destructive'
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const downloadTemplate = () => {
    const templateData = [
      {
        'İsim': 'Örnek Ürün Adı',
        'Açıklama': 'Ürün açıklaması buraya yazılacak',
        'SKU': 'SKU001',
        'Marka': 'Marka Adı',
        'Kategoriler': 'Elektronik',
        'Resim URL': 'https://example.com/image.jpg'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, 'urun-import-template.xlsx');
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
      const result = await smartBulkImport(products);
      setResults(result);
      setProgress(100);
      
      toast({
        title: 'İşlem Tamamlandı',
        description: `${result.created} yeni ürün eklendi, ${result.updated} ürün güncellendi, ${result.skipped} ürün atlandı`,
        variant: result.created > 0 || result.updated > 0 ? 'default' : 'destructive'
      });
    } catch (error) {
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
            <Button onClick={downloadTemplate} variant="outline" className="border-admin-border hover:bg-admin-muted text-admin-text-primary">
              <FileText className="h-4 w-4 mr-2" />
              Excel Şablonu İndir
            </Button>
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
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-admin-primary bg-admin-primary/5' : 'border-admin-border'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-admin-text-muted" />
              {isDragActive ? (
                <p className="text-admin-text-primary">Dosyayı buraya bırakın...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2 text-admin-text-primary">
                    Excel dosyasını sürükleyip bırakın
                  </p>
                  <p className="text-admin-text-secondary">
                    veya dosya seçmek için tıklayın
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-4 p-4 bg-admin-muted rounded-lg border border-admin-border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-admin-primary" />
                  <span className="font-medium text-admin-text-primary">{file.name}</span>
                  <Badge variant="secondary" className="bg-admin-primary/10 text-admin-primary">{products.length} ürün</Badge>
                </div>
              </div>
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