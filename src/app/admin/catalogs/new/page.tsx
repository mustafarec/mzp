'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Upload, Loader2, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  addCatalog, 
  uploadCatalogPDF, 
  uploadCatalogThumbnail 
} from '@/lib/actions/catalogActions';
import { AddCatalogFormSchema, type AddCatalogFormData } from '@/types';

export default function NewCatalogPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({ pdf: 0, thumbnail: 0 });
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AddCatalogFormData>({
    resolver: zodResolver(AddCatalogFormSchema),
    defaultValues: {
      title: '',
      brand: '',
      slug: '',
      description: '',
      category: '',
      isActive: true,
      sortOrder: 0,
    },
  });

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle title change and auto-generate slug
  const handleTitleChange = (title: string) => {
    form.setValue('title', title);
    if (!form.getValues('slug')) {
      form.setValue('slug', generateSlug(title));
    }
  };

  // Handle PDF file selection
  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Hata!',
          description: 'Sadece PDF dosyaları kabul edilir.',
          variant: 'destructive',
        });
        event.target.value = ''; // Clear input
        return;
      }
      
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 50) { // 50MB limit
        toast({
          title: 'Hata!',
          description: `PDF dosyası çok büyük (${fileSizeMB.toFixed(1)} MB). Maksimum 50MB olmalıdır.`,
          variant: 'destructive',
        });
        event.target.value = ''; // Clear input
        return;
      }
      
      // Show file size info for large files
      if (fileSizeMB > 10) {
        toast({
          title: 'Büyük Dosya Uyarısı',
          description: `Dosya boyutu ${fileSizeMB.toFixed(1)} MB. Yükleme uzun sürebilir.`,
        });
      }
      
      setPdfFile(file);
      setPdfPreview(`${file.name} (${fileSizeMB.toFixed(1)} MB)`);
    }
  };

  // Handle thumbnail file selection
  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Hata!',
          description: 'Sadece resim dosyaları kabul edilir (JPG, PNG, GIF, WebP).',
          variant: 'destructive',
        });
        event.target.value = ''; // Clear input
        return;
      }
      
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) { // 5MB limit
        toast({
          title: 'Hata!',
          description: `Resim dosyası çok büyük (${fileSizeMB.toFixed(1)} MB). Maksimum 5MB olmalıdır.`,
          variant: 'destructive',
        });
        event.target.value = ''; // Clear input
        return;
      }
      
      setThumbnailFile(file);
      
      // Create preview URL and clean up previous one
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };
  
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  // Submit form
  const onSubmit = async (data: AddCatalogFormData) => {
    if (!pdfFile) {
      toast({
        title: 'Hata!',
        description: 'PDF dosyası seçmelisiniz.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress({ pdf: 0, thumbnail: 0 });

      // Upload PDF file with progress tracking
      setUploadStatus('PDF dosyası yükleniyor...');
      const pdfResult = await uploadCatalogPDF(
        pdfFile, 
        data.title,
        (progress) => setUploadProgress(prev => ({ ...prev, pdf: progress }))
      );
      const fileSizeKB = Math.round(pdfFile.size / 1024);

      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnailFile) {
        setUploadStatus('Kapak resmi yükleniyor...');
        thumbnailUrl = await uploadCatalogThumbnail(
          thumbnailFile, 
          data.title,
          (progress) => setUploadProgress(prev => ({ ...prev, thumbnail: progress }))
        );
      }

      // Create catalog with extracted page count
      setUploadStatus('Katalog kaydediliyor...');
      await addCatalog(data, pdfResult.url, fileSizeKB, thumbnailUrl, pdfResult.pageCount);

      toast({
        title: 'Başarılı!',
        description: `Katalog başarıyla eklendi. ${pdfResult.pageCount > 0 ? `${pdfResult.pageCount} sayfa tespit edildi.` : ''}`,
      });

      router.push('/admin/catalogs');
    } catch (error) {
      console.error('Error creating catalog:', error);
      toast({
        title: 'Hata!',
        description: error instanceof Error ? error.message : 'Katalog eklenirken hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
      setUploadProgress({ pdf: 0, thumbnail: 0 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/catalogs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Katalog Ekle</h1>
          <p className="text-muted-foreground">
            Yeni bir marka katalogu ekleyin
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Katalog Başlığı</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Örn: 2024 Bahçe Ürünleri Katalogu"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marka</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: Husqvarna" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="husqvarna-2024-katalog" />
                        </FormControl>
                        <FormDescription>
                          URL'de kullanılacak benzersiz slug. Boş bırakırsanız başlıktan otomatik oluşturulur.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Katalog hakkında kısa açıklama..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: Bahçe Makineleri" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* File Uploads */}
              <Card>
                <CardHeader>
                  <CardTitle>Dosyalar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* PDF Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="pdf">PDF Katalog *</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="pdf"
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfFileChange}
                        className="flex-1"
                      />
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {pdfPreview && (
                      <p className="text-sm text-muted-foreground">
                        Seçilen dosya: {pdfPreview}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maksimum dosya boyutu: 50MB
                    </p>
                  </div>

                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Kapak Resmi (Opsiyonel)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        className="flex-1"
                      />
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {thumbnailPreview && (
                      <div className="mt-2">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="h-20 w-20 object-cover rounded border"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Maksimum dosya boyutu: 5MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ayarlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Aktif</FormLabel>
                          <FormDescription>
                            Katalog sitede görünür olsun mu?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sıralama</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                          />
                        </FormControl>
                        <FormDescription>
                          Düşük sayılar öne çıkar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Upload Progress */}
                  {isSubmitting && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">{uploadStatus}</div>
                      
                      {/* PDF Upload Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>PDF Yükleme</span>
                          <span>{uploadProgress.pdf}%</span>
                        </div>
                        <Progress value={uploadProgress.pdf} className="h-2" />
                      </div>
                      
                      {/* Thumbnail Upload Progress */}
                      {thumbnailFile && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Kapak Resmi</span>
                            <span>{uploadProgress.thumbnail}%</span>
                          </div>
                          <Progress value={uploadProgress.thumbnail} className="h-2" />
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Katalog Ekle
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}