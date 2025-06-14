"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createSlider, addImageToSlider } from '@/lib/actions/sliderActions';
import { DEFAULT_SLIDER_SETTINGS } from '@/lib/constants/slider';
import { uploadOptimizedImage } from '@/lib/firebase-storage';
import type { SliderWidget, SliderSettings, SliderImage } from '@/types';
import { ArrowLeft, Save, Images, Settings, Monitor, Smartphone, Tablet, Upload, Plus, X, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NewSliderPage() {
  const [title, setTitle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [position, setPosition] = useState<SliderWidget['position']>('homepage-hero');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [settings, setSettings] = useState<SliderSettings>(DEFAULT_SLIDER_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdSliderId, setCreatedSliderId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<{ file: File; preview: string; alt: string }[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Hata!',
        description: 'Slider başlığı gerekli.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await createSlider({
        title: title.trim(),
        displayName: displayName.trim() || undefined,
        position,
        settings,
        order,
        isActive
      });
      
      if (result.success && result.slider) {
        setCreatedSliderId(result.slider.id);
        
        // Upload preview images if any
        if (previewImages.length > 0) {
          await uploadPreviewImages(result.slider.id);
        }
        
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        router.push(`/admin/sliders/edit/${result.slider.id}`);
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Slider oluşturma hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Slider oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newImages: { file: File; preview: string; alt: string }[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        const alt = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        newImages.push({ file, preview, alt });
      }
    });
    
    setPreviewImages(prev => [...prev, ...newImages]);
  };

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview); // Clean up memory
      updated.splice(index, 1);
      return updated;
    });
  };

  const updateImageAlt = (index: number, alt: string) => {
    setPreviewImages(prev => prev.map((img, i) => 
      i === index ? { ...img, alt } : img
    ));
  };

  const uploadPreviewImages = async (sliderId: string) => {
    setUploading(true);
    try {
      for (let i = 0; i < previewImages.length; i++) {
        const { file, alt } = previewImages[i];
        
        // Upload image to Firebase Storage
        const imageUrl = await uploadOptimizedImage(
          file, 
          `sliders/${sliderId}/${Date.now()}_${file.name}`,
          1200
        );

        // Add image to slider
        await addImageToSlider(sliderId, {
          url: imageUrl,
          alt: alt || file.name.replace(/\.[^/.]+$/, ""),
          order: i
        });
      }
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const updateSettings = (key: keyof SliderSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateItemsPerView = (device: 'mobile' | 'tablet' | 'desktop', value: number) => {
    setSettings(prev => ({
      ...prev,
      itemsPerView: {
        ...prev.itemsPerView,
        [device]: value
      }
    }));
  };

  const updateHeight = (device: 'mobile' | 'tablet' | 'desktop', value: string) => {
    setSettings(prev => ({
      ...prev,
      height: {
        ...prev.height!,
        [device]: value
      }
    }));
  };

  const getPositionDescription = (pos: SliderWidget['position']) => {
    switch (pos) {
      case 'homepage-hero': return 'Ana sayfanın en üstünde, hero bölümünde görünür';
      case 'homepage-featured': return 'Ana sayfada öne çıkan bölümde görünür';
      case 'products-top': return 'Ürünler sayfasının üstünde görünür';
      case 'catalogs-top': return 'Kataloglar sayfasının üstünde görünür';
      case 'custom': return 'Manuel olarak yerleştirilen özel konumlarda görünür';
      default: return '';
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/sliders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Slider</h1>
          <p className="text-muted-foreground">
            Yeni dinamik resim slider'ı oluşturun
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Slider Başlığı *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn: Ana Sayfa Hero Slider"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Görünen Ad</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Örn: Öne Çıkan Ürünler"
                    />
                    <p className="text-xs text-muted-foreground">
                      Slider'ın sitede görünecek başlığı (opsiyonel)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Konum *</Label>
                  <Select value={position} onValueChange={(value: SliderWidget['position']) => setPosition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homepage-hero">Ana Sayfa - Hero</SelectItem>
                      <SelectItem value="homepage-featured">Ana Sayfa - Öne Çıkan</SelectItem>
                      <SelectItem value="products-top">Ürünler - Üst</SelectItem>
                      <SelectItem value="catalogs-top">Kataloglar - Üst</SelectItem>
                      <SelectItem value="custom">Özel Konum</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getPositionDescription(position)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Image Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Images className="h-5 w-5" />
                    Resim Yönetimi ({previewImages.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageSelect(e.target.files)}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={uploading}
                    >
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Yükleniyor...' : 'Resim Ekle'}
                      </label>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewImages.length === 0 ? (
                  <label 
                    htmlFor="image-upload" 
                    className="block text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/20 transition-colors"
                  >
                    <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Dosyaları buraya sürükle veya tıkla</h3>
                    <p className="text-muted-foreground mb-4">
                      Slider oluşturduktan sonra resimler otomatik yüklenecek
                    </p>
                    <div className="text-sm text-muted-foreground">
                      JPG, PNG, WebP desteklenir
                    </div>
                  </label>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previewImages.map((image, index) => (
                      <div key={index} className="group relative border rounded-lg overflow-hidden">
                        <div className="aspect-video relative bg-gray-100">
                          <img
                            src={image.preview}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                          
                          {/* Actions */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removePreviewImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Order */}
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary">
                              {index + 1}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <Input
                            value={image.alt}
                            onChange={(e) => updateImageAlt(index, e.target.value)}
                            placeholder="Resim açıklaması (Alt metin)"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Add New Image Card */}
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/20 transition-colors group"
                    >
                      <Plus className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors mb-2" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        Yeni Resim Ekle
                      </span>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slider Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Slider Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Autoplay Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoplay"
                        checked={settings.autoplay}
                        onCheckedChange={(checked) => updateSettings('autoplay', !!checked)}
                      />
                      <Label htmlFor="autoplay">Otomatik oynatma</Label>
                    </div>
                  </div>
                  
                  {settings.autoplay && (
                    <div className="space-y-2">
                      <Label htmlFor="interval">Otomatik geçiş süresi (ms)</Label>
                      <Input
                        id="interval"
                        type="number"
                        value={settings.autoplayInterval}
                        onChange={(e) => updateSettings('autoplayInterval', parseInt(e.target.value) || 5000)}
                        min="1000"
                        max="10000"
                        step="500"
                      />
                    </div>
                  )}
                </div>

                {/* Display Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showDots"
                      checked={settings.showDots}
                      onCheckedChange={(checked) => updateSettings('showDots', !!checked)}
                    />
                    <Label htmlFor="showDots">Nokta göstergesi</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showArrows"
                      checked={settings.showArrows}
                      onCheckedChange={(checked) => updateSettings('showArrows', !!checked)}
                    />
                    <Label htmlFor="showArrows">Ok butonları</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loop"
                      checked={settings.loop}
                      onCheckedChange={(checked) => updateSettings('loop', !!checked)}
                    />
                    <Label htmlFor="loop">Döngü</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pauseOnHover"
                      checked={settings.pauseOnHover}
                      onCheckedChange={(checked) => updateSettings('pauseOnHover', !!checked)}
                    />
                    <Label htmlFor="pauseOnHover">Hover'da duraklat</Label>
                  </div>
                </div>

                {/* Items Per View */}
                <div className="space-y-4">
                  <Label>Görünen Öğe Sayısı</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobileItems" className="flex items-center gap-2 text-sm">
                        <Smartphone className="h-4 w-4" />
                        Mobil
                      </Label>
                      <Input
                        id="mobileItems"
                        type="number"
                        value={settings.itemsPerView.mobile}
                        onChange={(e) => updateItemsPerView('mobile', parseInt(e.target.value) || 1)}
                        min="1"
                        max="5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tabletItems" className="flex items-center gap-2 text-sm">
                        <Tablet className="h-4 w-4" />
                        Tablet
                      </Label>
                      <Input
                        id="tabletItems"
                        type="number"
                        value={settings.itemsPerView.tablet}
                        onChange={(e) => updateItemsPerView('tablet', parseInt(e.target.value) || 2)}
                        min="1"
                        max="5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="desktopItems" className="flex items-center gap-2 text-sm">
                        <Monitor className="h-4 w-4" />
                        Masaüstü
                      </Label>
                      <Input
                        id="desktopItems"
                        type="number"
                        value={settings.itemsPerView.desktop}
                        onChange={(e) => updateItemsPerView('desktop', parseInt(e.target.value) || 3)}
                        min="1"
                        max="5"
                      />
                    </div>
                  </div>
                </div>

                {/* Height Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Slider Yüksekliği</Label>
                    <div className="text-xs text-muted-foreground">
                      Önerilen: Mobile 250-300px, Tablet 350-400px, Desktop 500-600px
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobileHeight" className="flex items-center gap-2 text-sm">
                        <Smartphone className="h-4 w-4" />
                        Mobil
                      </Label>
                      <Input
                        id="mobileHeight"
                        value={settings.height?.mobile || '250px'}
                        onChange={(e) => updateHeight('mobile', e.target.value)}
                        placeholder="250px"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tabletHeight" className="flex items-center gap-2 text-sm">
                        <Tablet className="h-4 w-4" />
                        Tablet
                      </Label>
                      <Input
                        id="tabletHeight"
                        value={settings.height?.tablet || '350px'}
                        onChange={(e) => updateHeight('tablet', e.target.value)}
                        placeholder="350px"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="desktopHeight" className="flex items-center gap-2 text-sm">
                        <Monitor className="h-4 w-4" />
                        Masaüstü
                      </Label>
                      <Input
                        id="desktopHeight"
                        value={settings.height?.desktop || '500px'}
                        onChange={(e) => updateHeight('desktop', e.target.value)}
                        placeholder="500px"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Responsive Image Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Resim Optimizasyon Rehberi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop (≥1024px)
                    </h4>
                    <p className="text-muted-foreground">
                      İdeal: 1920x1080px (16:9) veya 1920x800px (2.4:1)
                      <br />Maksimum: 500KB, Format: WebP/JPG
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      Tablet (768-1024px)
                    </h4>
                    <p className="text-muted-foreground">
                      İdeal: 1024x576px (16:9) veya 1024x427px (2.4:1)
                      <br />Maksimum: 300KB, Format: WebP/JPG
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile (&lt;768px)
                    </h4>
                    <p className="text-muted-foreground">
                      İdeal: 768x432px (16:9) veya 768x320px (2.4:1)
                      <br />Maksimum: 200KB, Format: WebP/JPG
                    </p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="font-medium text-xs uppercase tracking-wide mb-2">
                      💡 İpuçları
                    </h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Hero sliderlar için 2.4:1 - 3:1 oran idealdir</li>
                      <li>• Carousel sliderlar için 16:9 - 4:3 oran kullanın</li>
                      <li>• Yüksek kaliteli görseller için WebP formatı tercih edin</li>
                      <li>• Mobil deneyim için resim dosya boyutunu minimize edin</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slider Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Slider Özellikleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Sıralama</Label>
                  <Input
                    id="order"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Küçük değer önce görünür
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(!!checked)}
                  />
                  <Label htmlFor="isActive">Aktif</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pasif slider'lar sitede görünmez
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Oluşturuluyor...' : 'Slider Oluştur'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href="/admin/sliders">
                    İptal
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}