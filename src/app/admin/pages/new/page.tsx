"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addPage } from '@/lib/actions/pageActions';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { Page } from '@/types';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import Link from 'next/link';

export default function NewPagePage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [template, setTemplate] = useState<Page['template']>('default');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[çÇ]/g, 'c')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[ıİ]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's')
      .replace(/[üÜ]/g, 'u')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Hata!',
        description: 'Sayfa başlığı gerekli.',
        variant: 'destructive'
      });
      return;
    }

    if (!slug.trim()) {
      toast({
        title: 'Hata!',
        description: 'Slug gerekli.',
        variant: 'destructive'
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Hata!',
        description: 'İçerik gerekli.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('slug', slug.trim());
      formData.append('content', content.trim());
      formData.append('metaTitle', metaTitle.trim());
      formData.append('metaDescription', metaDescription.trim());
      formData.append('template', template);
      formData.append('isActive', isActive ? 'on' : '');

      const result = await addPage(formData);
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        router.push('/admin/pages');
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Sayfa ekleme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Sayfa eklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/pages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Sayfa</h1>
          <p className="text-muted-foreground">
            Yeni sayfa oluşturun
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sayfa İçeriği
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Sayfa Başlığı *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Örn: Hakkımızda"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="Örn: hakkimizda"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL'de kullanılacak SEO dostu isim
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">İçerik *</Label>
                  <RichTextEditor
                    value={content}
                    onChange={(value) => setContent(value)}
                    placeholder="Sayfa içeriğini buraya yazın..."
                    height={300}
                  />
                  <p className="text-xs text-muted-foreground">
                    Rich text editor ile formatlı içerik oluşturabilirsiniz
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Başlık</Label>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO için başlık (boş bırakılırsa sayfa başlığı kullanılır)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Karakter sayısı: {metaTitle.length}/60
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Açıklama</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Sayfanın kısa açıklaması"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Karakter sayısı: {metaDescription.length}/160
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sayfa Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Şablon</Label>
                  <Select value={template} onValueChange={(value: Page['template']) => setTemplate(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Varsayılan</SelectItem>
                      <SelectItem value="homepage">Ana Sayfa</SelectItem>
                      <SelectItem value="contact">İletişim</SelectItem>
                      <SelectItem value="about">Hakkımızda</SelectItem>
                    </SelectContent>
                  </Select>
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
                  Pasif sayfalar sitede görünmez
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
                  {loading ? 'Kaydediliyor...' : 'Sayfa Kaydet'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href="/admin/pages">
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