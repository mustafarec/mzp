"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSliders, deleteSlider, toggleSliderStatus } from '@/lib/actions/sliderActions';
import type { SliderWidget } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Images,
  MoreHorizontal,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export default function SlidersPage() {
  const [sliders, setSliders] = useState<SliderWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSliders();
  }, []);

  const loadSliders = async () => {
    try {
      const result = await getSliders();
      if (result.success) {
        setSliders(result.sliders);
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Slider\'lar yüklenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu slider\'ı silmek istediğinizden emin misiniz?')) return;
    
    const result = await deleteSlider(id);
    if (result.success) {
      toast({
        title: 'Başarılı!',
        description: result.message
      });
      setSliders(sliders.filter(s => s.id !== id));
    } else {
      toast({
        title: 'Hata!',
        description: result.message,
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleSliderStatus(id);
    if (result.success) {
      toast({
        title: 'Başarılı!',
        description: result.message
      });
      await loadSliders(); // Reload to get updated data
    } else {
      toast({
        title: 'Hata!',
        description: result.message,
        variant: 'destructive'
      });
    }
  };

  const getPositionLabel = (position: SliderWidget['position']) => {
    switch (position) {
      case 'homepage-hero': return 'Ana Sayfa - Hero';
      case 'homepage-featured': return 'Ana Sayfa - Öne Çıkan';
      case 'products-top': return 'Ürünler - Üst';
      case 'catalogs-top': return 'Kataloglar - Üst';
      case 'custom': return 'Özel Konum';
      default: return 'Bilinmeyen';
    }
  };

  const getPositionColor = (position: SliderWidget['position']) => {
    switch (position) {
      case 'homepage-hero': return 'bg-red-100 text-red-800';
      case 'homepage-featured': return 'bg-blue-100 text-blue-800';
      case 'products-top': return 'bg-green-100 text-green-800';
      case 'catalogs-top': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviceIcon = (itemsPerView: { mobile: number; tablet: number; desktop: number }) => {
    if (itemsPerView.mobile === 1 && itemsPerView.tablet === 1 && itemsPerView.desktop === 1) {
      return <Monitor className="h-4 w-4" />;
    }
    return <Images className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Slider Yönetimi</h1>
          <p className="text-muted-foreground">
            Dinamik resim slider'larını yönetin - Responsive tasarım ile tüm cihazlarda optimal görünüm
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/sliders/new">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Slider
          </Link>
        </Button>
      </div>

      {/* Responsive Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Monitor className="h-5 w-5 text-blue-600" />
              <Tablet className="h-5 w-5 text-green-600" />
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Responsive Slider Sistemi</h3>
              <p className="text-xs text-blue-700">
                Tüm slider'lar otomatik olarak mobil, tablet ve desktop cihazlara uyum sağlar. 
                Device bazında farklı resim sayısı ve yükseklik ayarları yapabilirsiniz.
              </p>
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                <span>Desktop: ≥1024px</span>
              </div>
              <div className="flex items-center gap-1">
                <Tablet className="h-3 w-3" />
                <span>Tablet: 768-1024px</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                <span>Mobile: &lt;768px</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sliders.map((slider) => (
            <Card key={slider.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Images className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{slider.title || 'Başlıksız Slider'}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {slider.isActive ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge className={getPositionColor(slider.position)}>
                    {getPositionLabel(slider.position)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getDeviceIcon(slider.settings.itemsPerView)}
                    <span>{slider.images.length} resim</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                {slider.displayName && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {slider.displayName}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      <span>{slider.settings.itemsPerView.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tablet className="h-3 w-3" />
                      <span>{slider.settings.itemsPerView.tablet}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      <span>{slider.settings.itemsPerView.desktop}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Sıra: {slider.order}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/admin/sliders/edit/${slider.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Link>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="px-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(slider.id)}
                      >
                        {slider.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Pasif Yap
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Aktif Yap
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(slider.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && sliders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz slider yok</h3>
            <p className="text-muted-foreground mb-4">
              İlk slider'ınızı oluşturarak başlayın
            </p>
            <Button asChild>
              <Link href="/admin/sliders/new">
                <Plus className="h-4 w-4 mr-2" />
                Slider Oluştur
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}