"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';
import type { Product, Category } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllProducts, deleteProduct, toggleProductStatus, bulkDeleteProducts, togglePremiumStatus, bulkSetPremium } from '@/lib/actions/productActions';
import { getAllCategories } from '@/lib/actions/categoryActions';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const { toast } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        getAllProducts(),
        getAllCategories()
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Ürünler yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.categoryId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    const result = await deleteProduct(id);
    if (result.success) {
      toast({ title: 'Başarılı!', description: result.message });
      loadProducts();
    } else {
      toast({ title: 'Hata!', description: result.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleProductStatus(id);
    if (result.success) {
      toast({ title: 'Başarılı!', description: result.message });
      loadProducts();
    } else {
      toast({ title: 'Hata!', description: result.message, variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast({ title: 'Uyarı!', description: 'Lütfen silinecek ürünleri seçin.', variant: 'destructive' });
      return;
    }
    
    if (!confirm(`${selectedProducts.length} ürünü silmek istediğinizden emin misiniz?`)) return;
    
    const result = await bulkDeleteProducts(selectedProducts);
    if (result.success) {
      toast({ title: 'Başarılı!', description: result.message });
      setSelectedProducts([]);
      loadProducts();
    } else {
      toast({ title: 'Hata!', description: result.message, variant: 'destructive' });
    }
  };

  const handleBulkSetPremium = async (isPremium: boolean) => {
    if (selectedProducts.length === 0) {
      toast({ title: 'Uyarı!', description: 'Lütfen ürünleri seçin.', variant: 'destructive' });
      return;
    }
    
    const result = await bulkSetPremium(selectedProducts, isPremium);
    if (result.success) {
      toast({ title: 'Başarılı!', description: result.message });
      setSelectedProducts([]);
      loadProducts();
    } else {
      toast({ title: 'Hata!', description: result.message, variant: 'destructive' });
    }
  };

  const handleTogglePremium = async (id: string) => {
    const result = await togglePremiumStatus(id);
    if (result.success) {
      toast({ title: 'Başarılı!', description: result.message });
      loadProducts();
    } else {
      toast({ title: 'Hata!', description: result.message, variant: 'destructive' });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  return (
    <div className="space-y-6 bg-admin-background min-h-screen p-6">
      <div className="flex items-center justify-between bg-admin-surface rounded-xl p-6 shadow-sm border border-admin-border">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Ürün Yönetimi</h1>
          <p className="text-admin-text-secondary">
            Toplam {products.length} ürün • Görüntülenen {filteredProducts.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProducts} disabled={loading} className="border-admin-border hover:bg-admin-muted text-admin-text-primary">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button asChild variant="outline" className="border-admin-border hover:bg-admin-muted text-admin-text-primary">
            <Link href="/admin/bulk-import">
              <Upload className="mr-2 h-4 w-4" />
              Excel İle Toplu Yükle
            </Link>
          </Button>
          <Button asChild className="bg-admin-primary hover:bg-admin-primary/90 text-white">
            <Link href="/admin/products/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Yeni Ürün
            </Link>
          </Button>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <Card className="bg-admin-surface border-admin-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-admin-text-muted" />
                <Input
                  placeholder="Ürün adı veya kategori ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-admin-border focus:border-admin-primary text-admin-text-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
                className={filterStatus === 'all' ? 'bg-admin-primary text-white' : 'border-admin-border hover:bg-admin-muted text-admin-text-primary'}
              >
                Tümü
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
                className={filterStatus === 'active' ? 'bg-admin-primary text-white' : 'border-admin-border hover:bg-admin-muted text-admin-text-primary'}
              >
                Aktif
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                size="sm"
                className={filterStatus === 'inactive' ? 'bg-admin-primary text-white' : 'border-admin-border hover:bg-admin-muted text-admin-text-primary'}
              >
                Pasif
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toplu İşlemler */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} ürün seçildi
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleBulkSetPremium(true)}>
                  ⭐ Premium Yap
                </Button>
                <Button variant="outline" onClick={() => handleBulkSetPremium(false)}>
                  Normal Yap
                </Button>
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Seçilenleri Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ürün Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Görsel</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Yükleniyor...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {searchTerm ? 'Arama kriterlerine uygun ürün bulunamadı.' : 'Henüz hiç ürün eklenmemiş.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {product.images && product.images.length > 0 ? (
                        <div className="relative w-12 h-12">
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            fill
                            sizes="48px"
                            src={product.images[0]}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs">
                          Yok
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">/{product.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isPremium ? 'default' : 'outline'} className={product.isPremium ? 'bg-yellow-500 text-white' : ''}>
                        {product.isPremium ? 'Premium' : 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/edit/${product.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(product.id, product.isActive)}>
                            {product.isActive ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Pasif Yap
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Aktif Yap
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePremium(product.id)}>
                            {product.isPremium ? (
                              <>
                                ⭐ Premium'dan Çıkar
                              </>
                            ) : (
                              <>
                                ⭐ Premium Yap
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
