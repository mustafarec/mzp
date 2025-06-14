"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createWidget } from '@/lib/actions/widgetActions';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { Widget } from '@/types';
import { ArrowLeft, Save, Layout } from 'lucide-react';
import Link from 'next/link';

export default function NewWidgetPage() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Widget['type']>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [settings, setSettings] = useState('{}');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Hata!',
        description: 'Widget başlığı gerekli.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      let parsedSettings = {};
      try {
        parsedSettings = JSON.parse(settings);
      } catch {
        parsedSettings = {};
      }

      const result = await createWidget({
        title: title.trim(),
        type,
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        settings: parsedSettings,
        order,
        isActive
      });
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        router.push('/admin/widgets');
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Widget oluşturma hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Widget oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getWidgetTypeDescription = (type: Widget['type']) => {
    switch (type) {
      case 'hero': return 'Ana banner/hero bölümü';
      case 'text': return 'Metin içerik bloku';
      case 'image': return 'Tek resim gösterimi';
      case 'gallery': return 'Resim galerisi';
      case 'contact': return 'İletişim formu';
      case 'feature': return 'Özellik listesi';
      case 'slider': return 'Dinamik resim slider\'ı';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/widgets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Widget</h1>
          <p className="text-muted-foreground">
            Yeni sayfa bileşeni oluşturun
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Widget İçeriği
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Widget Başlığı *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn: Ana Banner"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Widget Türü *</Label>
                    <Select value={type} onValueChange={(value: Widget['type']) => setType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Hero Banner</SelectItem>
                        <SelectItem value="text">Metin Bloku</SelectItem>
                        <SelectItem value="image">Resim</SelectItem>
                        <SelectItem value="gallery">Galeri</SelectItem>
                        <SelectItem value="contact">İletişim</SelectItem>
                        <SelectItem value="feature">Özellik</SelectItem>
                        <SelectItem value="slider">Resim Slider</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getWidgetTypeDescription(type)}
                    </p>
                  </div>
                </div>

                {(type === 'text' || type === 'hero' || type === 'feature') && (
                  <div className="space-y-2">
                    <Label htmlFor="content">İçerik</Label>
                    <RichTextEditor
                      value={content}
                      onChange={(value) => setContent(value)}
                      placeholder="Widget içeriğini buraya yazın..."
                      height={200}
                    />
                  </div>
                )}

                {(type === 'image' || type === 'hero') && (
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Resim URL</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Medya kütüphanesinden URL kopyalayabilirsiniz
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gelişmiş Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings">Widget Ayarları (JSON)</Label>
                  <Textarea
                    id="settings"
                    value={settings}
                    onChange={(e) => setSettings(e.target.value)}
                    placeholder='{"backgroundColor": "white", "textColor": "black"}'
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Widget'a özel ayarlar JSON formatında
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Widget Ayarları</CardTitle>
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
                  Pasif widget'lar sitede görünmez
                </p>
              </CardContent>
            </Card>

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
                  {loading ? 'Oluşturuluyor...' : 'Widget Oluştur'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href="/admin/widgets">
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