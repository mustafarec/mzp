'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  BookOpen, 
  Download, 
  Eye,
  FileText,
  Filter,
  Loader2,
  PlayCircle,
  X
} from 'lucide-react';
import { getCatalogs } from '@/lib/actions/catalogActions';
import CatalogFlipbook from '@/components/ui/CatalogFlipbook';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Catalog } from '@/types';

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [flipbookDialog, setFlipbookDialog] = useState<{
    open: boolean;
    catalog: Catalog | null;
  }>({ open: false, catalog: null });

  // Load catalogs
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoading(true);
        const catalogsData = await getCatalogs();
        setCatalogs(catalogsData);
      } catch (error) {
        console.error('Error loading catalogs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  // Get unique brands and categories for filters
  const brands = Array.from(new Set(catalogs.map(catalog => catalog.brand))).sort();
  const categories = Array.from(new Set(
    catalogs
      .map(catalog => catalog.category)
      .filter((category): category is string => Boolean(category))
  )).sort();

  // Filter catalogs
  const filteredCatalogs = catalogs.filter(catalog => {
    const matchesSearch = 
      catalog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalog.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catalog.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = selectedBrand === 'all' || catalog.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'all' || catalog.category === selectedCategory;
    
    return matchesSearch && matchesBrand && matchesCategory;
  });

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
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Open flipbook preview
  const openFlipbookPreview = (catalog: Catalog) => {
    setFlipbookDialog({
      open: true,
      catalog: catalog
    });
  };

  // Close flipbook preview
  const closeFlipbookPreview = () => {
    setFlipbookDialog({
      open: false,
      catalog: null
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Marka Katalogları</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Bahçe ve ziraat ürünleri markalarının en güncel kataloglarını inceleyin
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Arama ve Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Katalog ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Brand Filter */}
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Marka seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Markalar</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand('all');
                setSelectedCategory('all');
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-6 text-sm text-muted-foreground">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kataloglar yükleniyor...
          </div>
        ) : (
          `${filteredCatalogs.length} katalog bulundu`
        )}
      </div>

      {/* Catalogs Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Kataloglar yükleniyor...</p>
          </div>
        </div>
      ) : filteredCatalogs.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Katalog bulunamadı</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedBrand !== 'all' || selectedCategory !== 'all'
              ? 'Arama kriterlerinizi değiştirerek tekrar deneyin.'
              : 'Henüz katalog eklenmemiş.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredCatalogs.map((catalog) => (
            <Card key={catalog.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                {/* Thumbnail */}
                <Link href={`/catalogs/${catalog.slug}`}>
                  <div className="relative aspect-[4/5] mb-3 overflow-hidden rounded-lg bg-gray-100 cursor-pointer">
                    {catalog.thumbnailUrl ? (
                      <Image
                        src={catalog.thumbnailUrl}
                        alt={catalog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Brand Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                        {catalog.brand}
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    {catalog.category && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
                          {catalog.category}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </Link>

                <div>
                  <Link href={`/catalogs/${catalog.slug}`}>
                    <CardTitle className="line-clamp-2 mb-1 text-sm hover:text-blue-600 transition-colors cursor-pointer">
                      {catalog.title}
                    </CardTitle>
                  </Link>
                  {catalog.description && (
                    <CardDescription className="line-clamp-1 text-xs">
                      {catalog.description}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Info */}
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
                  <span>{formatFileSize(catalog.fileSize)}</span>
                  {catalog.pageCount && (
                    <span className="text-right">{catalog.pageCount} sayfa</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button asChild size="sm" className="flex-1 text-xs">
                    <Link href={`/catalogs/${catalog.slug}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      Görüntüle
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="px-2"
                    onClick={() => openFlipbookPreview(catalog)}
                    title="Flipbook önizleme"
                  >
                    <PlayCircle className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="px-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = catalog.pdfUrl;
                      link.download = `${catalog.title}.pdf`;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button (if needed in future) */}
      {/* {filteredCatalogs.length > 0 && (
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Daha Fazla Katalog Yükle
          </Button>
        </div>
      )} */}

      {/* Flipbook Preview Dialog */}
      <Dialog open={flipbookDialog.open} onOpenChange={(open) => {
        if (!open) {
          closeFlipbookPreview();
        }
      }}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-2 sm:p-4">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm sm:text-lg line-clamp-1">
                {flipbookDialog.catalog?.title} - Flipbook Önizleme
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeFlipbookPreview}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {flipbookDialog.catalog && (
            <div className="flex-1 overflow-hidden">
              <CatalogFlipbook
                catalog={flipbookDialog.catalog}
                className="h-full"
                showControls={true}
                autoLoad={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}