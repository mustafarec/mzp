"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  getSliderById, 
  updateSlider, 
  addImageToSlider, 
  updateSliderImage,
  removeImageFromSlider,
  reorderSliderImages
} from '@/lib/actions/sliderActions';
import { uploadOptimizedImage } from '@/lib/firebase-storage';
import type { SliderWidget, SliderSettings, SliderImage } from '@/types';
import { 
  ArrowLeft, 
  Save, 
  Images, 
  Settings, 
  Monitor, 
  Smartphone, 
  Tablet,
  Upload,
  X,
  Edit,
  Trash2,
  GripVertical,
  ExternalLink,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';

interface EditImageModalProps {
  image: SliderImage;
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: Partial<SliderImage>) => void;
}

function EditImageModal({ image, isOpen, onClose, onSave }: EditImageModalProps) {
  const [formData, setFormData] = useState({
    alt: image.alt || '',
    title: image.title || '',
    description: image.description || '',
    linkUrl: image.linkUrl || '',
    linkText: image.linkText || ''
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resim Düzenle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alt">Alt Metin *</Label>
              <Input
                id="alt"
                value={formData.alt}
                onChange={(e) => setFormData(prev => ({ ...prev, alt: e.target.value }))}
                placeholder="Resmin açıklaması"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Resim başlığı"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Resim açıklaması"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkText">Link Metni</Label>
              <Input
                id="linkText"
                value={formData.linkText}
                onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                placeholder="Daha fazla bilgi"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EditSliderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const sliderId = params.id as string;

  const [slider, setSlider] = useState<SliderWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<SliderImage | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [position, setPosition] = useState<SliderWidget['position']>('homepage-hero');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [settings, setSettings] = useState<SliderSettings>({
    autoplay: true,
    autoplayInterval: 5000,
    showDots: true,
    showArrows: true,
    loop: true,
    pauseOnHover: true,
    itemsPerView: { mobile: 1, tablet: 1, desktop: 1 },
    height: { mobile: '250px', tablet: '350px', desktop: '500px' },
    transition: 'slide',
    speed: 500
  });

  useEffect(() => {
    loadSlider();
  }, [sliderId]);

  const loadSlider = async () => {
    try {
      const result = await getSliderById(sliderId);
      if (result.success && result.slider) {
        const sliderData = result.slider;
        setSlider(sliderData);
        setTitle(sliderData.title || '');
        setDisplayName(sliderData.displayName || '');
        setPosition(sliderData.position);
        setOrder(sliderData.order);
        setIsActive(sliderData.isActive);
        setSettings(sliderData.settings);
      } else {
        toast({
          title: 'Hata!',
          description: 'Slider bulunamadı.',
          variant: 'destructive'
        });
        router.push('/admin/sliders');
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Slider yüklenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Hata!',
        description: 'Slider başlığı gerekli.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const result = await updateSlider(sliderId, {
        title: title.trim(),
        displayName: displayName.trim() || undefined,
        position,
        settings,
        order,
        isActive
      });
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        await loadSlider(); // Reload data
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Slider güncellenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      
      // Upload image to Firebase Storage
      const imageUrl = await uploadOptimizedImage(
        file, 
        `sliders/${sliderId}/${Date.now()}_${file.name}`,
        1200,
        (progress) => {
          // Could show progress here
        }
      );

      // Add image to slider
      const result = await addImageToSlider(sliderId, {
        url: imageUrl,
        alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for alt
        order: slider?.images.length || 0
      });

      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message
        });
        await loadSlider(); // Reload to get updated images
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Hata!',
        description: 'Resim yüklenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditImage = async (imageData: Partial<SliderImage>) => {
    if (!editingImage) return;

    try {
      const result = await updateSliderImage(sliderId, editingImage.id, imageData);
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message
        });
        await loadSlider();
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Resim güncellenirken hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Bu resmi silmek istediğinizden emin misiniz?')) return;

    try {
      const result = await removeImageFromSlider(sliderId, imageId);
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message
        });
        await loadSlider();
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Resim silinirken hata oluştu.',
        variant: 'destructive'
      });
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!slider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Slider bulunamadı</h2>
        <Button asChild className="mt-4">
          <Link href="/admin/sliders">Geri Dön</Link>
        </Button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Slider Düzenle</h1>
          <p className="text-muted-foreground">
            {slider.title} - {slider.images.length} resim
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {slider.isActive ? (
            <Badge className="bg-green-100 text-green-800">
              <Eye className="h-3 w-3 mr-1" />
              Aktif
            </Badge>
          ) : (
            <Badge variant="secondary">
              <EyeOff className="h-3 w-3 mr-1" />
              Pasif
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
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
              </div>
            </CardContent>
          </Card>

          {/* Image Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  Resim Yönetimi ({slider.images.length})
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <Button
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
              {/* Image Upload Guidelines */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-3">
                <div className="flex items-start gap-2">
                  <Images className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Resim Optimizasyon İpuçları:</p>
                    <ul className="space-y-0.5">
                      <li>• Desktop: 1920x1080px (maksimum 500KB)</li>
                      <li>• Tablet: 1024x576px (maksimum 300KB)</li>
                      <li>• Mobile: 768x432px (maksimum 200KB)</li>
                      <li>• WebP/JPG formatı, 16:9 oran tercih edin</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {slider.images.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Henüz resim yok</h3>
                  <p className="text-muted-foreground mb-4">
                    İlk resminizi ekleyerek başlayın
                  </p>
                  <label htmlFor="image-upload">
                    <Button variant="outline" disabled={uploading}>
                      <Plus className="h-4 w-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'İlk Resmi Ekle'}
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slider.images
                    .sort((a, b) => a.order - b.order)
                    .map((image) => (
                    <div key={image.id} className="group relative border rounded-lg overflow-hidden">
                      <div className="aspect-video relative bg-gray-100">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                        
                        {/* Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingImage(image)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Order */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary">
                            {image.order + 1}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {image.title || image.alt}
                        </h4>
                        {image.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {image.description}
                          </p>
                        )}
                        {image.linkUrl && (
                          <div className="flex items-center gap-1 mt-2">
                            <ExternalLink className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-600 truncate">
                              {image.linkText || 'Link'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
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

        {/* Sidebar */}
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
                    İdeal: 1920x1080px (16:9)
                    <br />Maksimum: 500KB, WebP/JPG
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Tablet className="h-4 w-4" />
                    Tablet (768-1024px)
                  </h4>
                  <p className="text-muted-foreground">
                    İdeal: 1024x576px (16:9)
                    <br />Maksimum: 300KB, WebP/JPG
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile (&lt;768px)
                  </h4>
                  <p className="text-muted-foreground">
                    İdeal: 768x432px (16:9)
                    <br />Maksimum: 200KB, WebP/JPG
                  </p>
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-medium text-xs uppercase tracking-wide mb-2">
                    💡 İpuçları
                  </h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Hero sliderlar için 2.4:1 - 3:1 oran</li>
                    <li>• Carousel için 16:9 - 4:3 oran</li>
                    <li>• WebP formatı tercih edin</li>
                    <li>• Dosya boyutunu optimize edin</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
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
                onClick={handleSave}
                className="w-full" 
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                asChild
              >
                <Link href="/admin/sliders">
                  Geri Dön
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Image Modal */}
      {editingImage && (
        <EditImageModal
          image={editingImage}
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleEditImage}
        />
      )}
    </div>
  );
}