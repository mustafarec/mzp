// src/app/catalogs/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  X,
  Star
} from 'lucide-react';
import PDFViewerDialog from '@/components/ui/PDFViewerDialog';
import { getCatalogs } from '@/lib/actions/catalogActions';
import type { Catalog } from '@/types';

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Handle opening PDF dialog
  const handleViewCatalog = (catalog: Catalog, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(catalog.pdfUrl)}`;
      window.open(proxyUrl, '_blank');
    } else {
      setSelectedCatalog(catalog);
      setDialogOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      
      {/* Header */}
      <div className="text-center mb-12">
        <BookOpen className="h-12 w-12 mx-auto text-agriculture-accent mb-4" />
        <h1 className="apple-hero-text text-agriculture-primary mb-4">
          Marka <span className="text-agriculture-accent">Katalogları</span>
        </h1>
        <p className="apple-hero-subtext text-agriculture-600 max-w-3xl mx-auto">
          Bahçe ve ziraat sektörünün öncü markalarının en güncel ürün kataloglarını keşfedin, 
          ihtiyaçlarınıza en uygun çözümleri bulun.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border sticky top-20 z-40 mb-8">
          <div className="grid gap-4 md:grid-cols-4 items-center">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Katalog adı, marka veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="h-10">
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

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10">
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
            
            {(searchTerm || selectedBrand !== 'all' || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBrand('all');
                  setSelectedCategory('all');
                }}
                className="md:col-start-4 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Filtreleri Temizle
              </Button>
            )}
          </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6 text-sm text-muted-foreground">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Kataloglar yükleniyor...
          </div>
        ) : (
          `Toplam ${filteredCatalogs.length} katalog bulundu`
        )}
      </div>

      {/* Catalogs Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredCatalogs.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sonuç Bulunamadı</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Arama kriterlerinize uygun katalog bulunamadı. Lütfen filtrelerinizi değiştirerek tekrar deneyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredCatalogs.map((catalog) => (
            <div 
              key={catalog.id} 
              className="group block cursor-pointer apple-card-hover"
              onClick={(e) => handleViewCatalog(catalog, e)}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 shadow-md">
                  {catalog.thumbnailUrl ? (
                    <Image
                      src={catalog.thumbnailUrl}
                      alt={catalog.title}
                      fill
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <BookOpen className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                     <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
              </div>
              <div className="pt-3">
                  <p className="text-xs text-muted-foreground">{catalog.brand}</p>
                  <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-agriculture-accent transition-colors">
                    {catalog.title}
                  </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Dialog */}
      {selectedCatalog && dialogOpen && (
        <PDFViewerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          catalog={selectedCatalog}
        />
      )}

    </div>
  );
}