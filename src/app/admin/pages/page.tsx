"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAllPages, deletePage, togglePageStatus } from '@/lib/actions/pageActions';
import type { Page } from '@/types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  Calendar,
  Settings
} from 'lucide-react';

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    const filtered = pages.filter(page =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPages(filtered);
  }, [pages, searchTerm]);

  const loadPages = async () => {
    try {
      const allPages = await getAllPages();
      setPages(allPages);
      setFilteredPages(allPages);
    } catch (error) {
      console.error('Sayfalar yüklenirken hata:', error);
      toast({
        title: 'Hata!',
        description: 'Sayfalar yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" sayfasını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const result = await deletePage(id);
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        loadPages();
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Sayfa silme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Sayfa silinirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await togglePageStatus(id);
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: result.message,
        });
        loadPages();
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Sayfa durum değiştirme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Sayfa durumu değiştirilirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (date: Date) => {
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sayfa Yönetimi</h1>
          <p className="text-muted-foreground">
            Website sayfalarını yönetin
          </p>
        </div>
        
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sayfa
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sayfalar ({filteredPages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sayfa ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {filteredPages.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{page.title}</h3>
                    <Badge variant={page.isActive ? 'default' : 'secondary'}>
                      {page.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <Badge variant="outline">
                      {page.template}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>/{page.slug}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(page.updatedAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/${page.slug}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/pages/edit/${page.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(page.id)}
                  >
                    {page.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(page.id, page.title)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredPages.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sayfa bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Arama kriterlerinizi değiştirin' : 'Henüz hiç sayfa eklenmemiş'}
                </p>
                {!searchTerm && (
                  <Button asChild>
                    <Link href="/admin/pages/new">
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Sayfayı Ekle
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 