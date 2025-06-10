"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateProduct, getProductById } from '@/lib/actions/productActions';
import { getAllCategories } from '@/lib/actions/categoryActions';
import ImageUploader from '@/components/ui/ImageUploader';
import type { Category, Product } from '@/types';
import { ArrowLeft, Save, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [sku, setSku] = useState('');
  const [tags, setTags] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadCategories();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const product = await getProductById(productId);
      if (product) {
        setName(product.name);
        setSlug(product.slug);
        setDescription(product.description);
        setCategoryId(product.categoryId);
        setImages(product.images || []);
        setIsActive(product.isActive);
        setIsPremium(product.isPremium || false);
        setSku(product.sku || '');
        setTags(product.tags?.join(', ') || '');
      } else {
        toast({
          title: 'Hata!',
          description: 'Ürün bulunamadı.',
          variant: 'destructive'
        });
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Ürün yüklenirken hata:', error);
      toast({
        title: 'Hata!',
        description: 'Ürün yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoadingProduct(false);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      const flatCategories = flattenCategories(allCategories);
      setCategories(flatCategories);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const flattenCategories = (categories: Category[], level = 0): Category[] => {
    let result: Category[] = [];
    for (const category of categories) {
      result.push({ ...category, name: '  '.repeat(level) + category.name });
      if (category.children) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    }
    return result;
  };

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

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleImagesUpload = (urls: string[]) => {
    setImages(urls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Hata!',
        description: 'Ürün adı gerekli.',
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

    if (!categoryId) {
      toast({
        title: 'Hata!',
        description: 'Kategori seçimi gerekli.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('slug', slug.trim());
      formData.append('description', description.trim());
      formData.append('categoryId', categoryId);
      formData.append('images', JSON.stringify(images));
      formData.append('isActive', isActive ? 'on' : '');
      formData.append('isPremium', isPremium ? 'on' : '');
      formData.append('sku', sku.trim());
      formData.append('tags', tags.trim());

      const result = await updateProduct(productId, formData);
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        router.push('/admin/products');
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Ürün güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Ürün yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ürün Düzenle</h1>
          <p className="text-muted-foreground">
            {name || 'Ürün bilgilerini düzenleyin'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Ürün Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ürün Adı *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Örn: Organik Domates Tohumu"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="Örn: organik-domates-tohumu"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL'de kullanılacak SEO dostu isim
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ürün hakkında detaylı açıklama..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {loadingCategories && (
                      <p className="text-xs text-muted-foreground">Kategoriler yükleniyor...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Örn: TOM-ORG-001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Etiketleri virgülle ayırın (organik, domates, tohum)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ürün Resimleri</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onUpload={handleImagesUpload}
                  folder="products"
                  maxFiles={10}
                  existingImages={images}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Durum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(!!checked)}
                  />
                  <Label htmlFor="isActive">Aktif</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pasif ürünler sitede görünmez
                </p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPremium"
                    checked={isPremium}
                    onCheckedChange={(checked) => setIsPremium(!!checked)}
                  />
                  <Label htmlFor="isPremium">Premium Ürün</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Premium ürünler ana sayfada öne çıkar
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
                  {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href="/admin/products">
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