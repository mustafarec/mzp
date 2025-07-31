"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getWidgets, deleteWidget } from '@/lib/actions/widgetActions';
import type { Widget } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Grip,
  Image,
  Type,
  Layout,
  Mail,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      const result = await getWidgets();
      if (result.success) {
        setWidgets(result.widgets);
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Widget\'lar yüklenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu widget\'ı silmek istediğinizden emin misiniz?')) return;
    
    const result = await deleteWidget(id);
    if (result.success) {
      toast({
        title: 'Başarılı!',
        description: result.message
      });
      setWidgets(widgets.filter(w => w.id !== id));
    } else {
      toast({
        title: 'Hata!',
        description: result.message,
        variant: 'destructive'
      });
    }
  };

  const getWidgetIcon = (type: Widget['type']) => {
    switch (type) {
      case 'hero': return <Layout className="h-5 w-5" />;
      case 'text': return <Type className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'gallery': return <Grip className="h-5 w-5" />;
      case 'contact': return <Mail className="h-5 w-5" />;
      case 'feature': return <Star className="h-5 w-5" />;
      case 'slider': return <Image className="h-5 w-5" />;
      default: return <Layout className="h-5 w-5" />;
    }
  };

  const getWidgetTypeLabel = (type: Widget['type']) => {
    switch (type) {
      case 'hero': return 'Hero Banner';
      case 'text': return 'Metin Bloku';
      case 'image': return 'Resim';
      case 'gallery': return 'Galeri';
      case 'contact': return 'İletişim';
      case 'feature': return 'Özellik';
      case 'slider': return 'Resim Slider';
      default: return 'Bilinmeyen';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Widget Yönetimi</h1>
          <p className="text-muted-foreground">
            Sayfa bileşenlerini yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/widgets/new">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Widget
          </Link>
        </Button>
      </div>

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
          {widgets.map((widget) => (
            <Card key={widget.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getWidgetIcon(widget.type)}
                    <CardTitle className="text-lg">{widget.title || 'Başlıksız Widget'}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {widget.isActive ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getWidgetTypeLabel(widget.type)}
                  </Badge>
                  <Badge variant="outline">
                    Sıra: {widget.order}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                {widget.content && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {widget.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                )}
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/widgets/edit/${widget.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(widget.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && widgets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz widget yok</h3>
            <p className="text-muted-foreground mb-4">
              İlk widget'ınızı oluşturarak başlayın
            </p>
            <Button asChild>
              <Link href="/admin/widgets/new">
                <Plus className="h-4 w-4 mr-2" />
                Widget Oluştur
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 