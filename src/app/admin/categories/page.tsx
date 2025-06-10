"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllCategories, 
  buildCategoryTree, 
  deleteCategory, 
  toggleCategoryStatus 
} from '@/lib/actions/categoryActions';
import type { Category } from '@/types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical, 
  FolderTree,
  Eye,
  EyeOff,
  Package
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

interface CategoryTreeItemProps {
  category: Category;
  level: number;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

function CategoryTreeItem({ category, level, onDelete, onToggleStatus }: CategoryTreeItemProps) {
  const padding = level * 20;
  
  return (
    <div className="border rounded-lg bg-white">
      <div 
        className="flex items-center justify-between p-4"
        style={{ paddingLeft: `${padding + 16}px` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {level > 0 && (
              <div className="w-4 h-px bg-border" />
            )}
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{category.name}</h3>
              <Badge variant={category.isActive ? "default" : "secondary"}>
                {category.isActive ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">/{category.slug}</p>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Sıra: {category.sortOrder}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/categories/${category.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onToggleStatus(category.id, !category.isActive)}
              >
                {category.isActive ? (
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{category.name}" kategorisini silmek istediğinizden emin misiniz?
                      Bu işlem geri alınamaz.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(category.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {category.children && category.children.length > 0 && (
        <div className="border-t bg-muted/30">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const allCategories = await getAllCategories();
      const categoryTree = buildCategoryTree(allCategories);
      setCategories(categoryTree);
      setFilteredCategories(categoryTree);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      toast({
        title: 'Hata!',
        description: 'Kategoriler yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCategories(categories);
      return;
    }

    const filterCategories = (cats: Category[]): Category[] => {
      return cats.reduce((acc: Category[], category) => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const filteredChildren = category.children ? filterCategories(category.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...category,
            children: filteredChildren
          });
        }
        
        return acc;
      }, []);
    };

    setFilteredCategories(filterCategories(categories));
  }, [searchTerm, categories]);

  const handleDeleteCategory = async (id: string) => {
    try {
      const result = await deleteCategory(id);
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        loadCategories();
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Kategori silme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Kategori silinirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const result = await toggleCategoryStatus(id, isActive);
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        loadCategories();
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Kategori durum güncelleme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Kategori durumu güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const getTotalCategories = (cats: Category[]): number => {
    return cats.reduce((total, category) => {
      return total + 1 + (category.children ? getTotalCategories(category.children) : 0);
    }, 0);
  };

  const getActiveCategories = (cats: Category[]): number => {
    return cats.reduce((total, category) => {
      const current = category.isActive ? 1 : 0;
      const children = category.children ? getActiveCategories(category.children) : 0;
      return total + current + children;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Kategoriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kategoriler</h1>
          <p className="text-muted-foreground">
            Ürün kategorilerini yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kategori
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCategories(categories)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kategori</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveCategories(categories)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasif Kategori</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalCategories(categories) - getActiveCategories(categories)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kategori Listesi</CardTitle>
              <CardDescription>
                Tüm kategoriler hierarşik yapıda görüntüleniyor
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kategori ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Kategori bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? `"${searchTerm}" ile eşleşen kategori bulunamadı.`
                    : "Henüz hiç kategori eklenmemiş."
                  }
                </p>
                {!searchTerm && (
                  <Button asChild>
                    <Link href="/admin/categories/new">
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Kategoriyi Ekle
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    level={0}
                    onDelete={handleDeleteCategory}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 