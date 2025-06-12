'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  Download,
  BookOpen,
  FileText,
  Loader2
} from 'lucide-react';
import { getAllCatalogs, deleteCatalog } from '@/lib/actions/catalogActions';
import { useToast } from '@/hooks/use-toast';
import type { Catalog } from '@/types';

export default function AdminCatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load catalogs
  const loadCatalogs = async () => {
    try {
      setLoading(true);
      const catalogsData = await getAllCatalogs();
      setCatalogs(catalogsData);
      
      // Show info if no catalogs exist
      if (catalogsData.length === 0) {
        toast({
          title: 'Bilgi',
          description: 'Henüz katalog bulunmuyor. İlk katalogunuzu ekleyebilirsiniz.',
        });
      }
    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast({
        title: 'Hata!',
        description: 'Kataloglar yüklenirken hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
      // Set empty array on error
      setCatalogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  // Filter catalogs based on search term
  const filteredCatalogs = catalogs.filter(catalog =>
    catalog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    catalog.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    catalog.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete catalog
  const handleDeleteCatalog = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCatalog(id);
      
      toast({
        title: 'Başarılı!',
        description: 'Katalog başarıyla silindi.',
      });
      
      // Reload catalogs
      await loadCatalogs();
    } catch (error) {
      console.error('Error deleting catalog:', error);
      toast({
        title: 'Hata!',
        description: 'Katalog silinirken hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Format file size
  const formatFileSize = (sizeInKB: number): string => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    }
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Kataloglar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Katalog Yönetimi</h1>
          <p className="text-muted-foreground">
            Marka kataloglarını ekleyin, düzenleyin ve yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/catalogs/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Katalog Ekle
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Katalog</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{catalogs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Katalog</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {catalogs.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sayfa</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {catalogs.reduce((sum, catalog) => sum + (catalog.pageCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Boyut</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(catalogs.reduce((sum, catalog) => sum + catalog.fileSize, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Katalog Listesi</CardTitle>
          <CardDescription>
            Katalogları arayın ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Katalog adı, marka veya kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Catalogs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Katalog</TableHead>
                  <TableHead>Marka</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Boyut</TableHead>
                  <TableHead>Sayfa</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'Arama kriterlerine uygun katalog bulunamadı.' : 'Henüz katalog eklenmemiş.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCatalogs.map((catalog) => (
                    <TableRow key={catalog.id}>
                      <TableCell>
                        <div className="font-medium">{catalog.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {catalog.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{catalog.brand}</Badge>
                      </TableCell>
                      <TableCell>
                        {catalog.category && (
                          <Badge variant="outline">{catalog.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(catalog.fileSize)}</TableCell>
                      <TableCell>{catalog.pageCount || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={catalog.isActive ? 'default' : 'secondary'}>
                          {catalog.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(catalog.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/catalogs/${catalog.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/catalogs/edit/${catalog.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === catalog.id}
                              >
                                {deletingId === catalog.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Katalog Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{catalog.title}" katalogunu silmek istediğinizden emin misiniz? 
                                  Bu işlem geri alınamaz ve ilgili PDF dosyası da silinecek.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCatalog(catalog.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}