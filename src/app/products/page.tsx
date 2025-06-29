"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Grid, List, Package, ChevronDown, ChevronUp } from 'lucide-react';
import Carousel from '@/components/ui/Carousel';
import DynamicSlider from '@/components/ui/DynamicSlider';
import ProductDetailDialog from '@/components/ui/ProductDetailDialog';
import { Pagination, PaginationInfo, ItemsPerPageSelector } from '@/components/ui/pagination';
import { getAllProducts } from '@/lib/actions/productActions';
import { getAllCategories } from '@/lib/actions/categoryActions';
import { generateDisplayName } from '@/lib/actions/categoryActions';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import type { Product, Category } from '@/types';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productsGridRef = useRef<HTMLDivElement>(null);
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition({
    key: 'productsPage',
    restoreDelay: 200,
    autoSave: false
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'premium');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit') || '24'));
  const [showFilters, setShowFilters] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(Boolean(searchTerm));
  const [contentRendered, setContentRendered] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const updateUrl = (params: Record<string, string | number | string[]>) => {
    const urlParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0)) {
        urlParams.delete(key);
      } else if (Array.isArray(value)) {
        urlParams.set(key, value.join(','));
      } else {
        urlParams.set(key, value.toString());
      }
    });

    if (currentPage === 1) urlParams.delete('page');
    if (itemsPerPage === 24) urlParams.delete('limit');
    if (sortBy === 'premium') urlParams.delete('sort');

    router.replace(`/products?${urlParams.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const savedViewMode = localStorage.getItem('productsViewMode') as 'grid' | 'list';
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  // Handle product change in dialog
  const handleProductChange = (product: Product) => {
    setSelectedProduct(product);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ]);
        
        const activeProducts = productsData.filter(product => product.isActive);
        const sortedProducts = activeProducts.sort((a, b) => {
          if (a.isPremium && !b.isPremium) return -1;
          if (!a.isPremium && b.isPremium) return 1;
          return 0;
        });
        setProducts(sortedProducts);
        setCategories(categoriesData.filter(cat => cat.isActive));
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.categoryId));
    }

    switch (sortBy) {
      case 'premium':
        filtered.sort((a, b) => {
          if (a.isPremium && !b.isPremium) return -1;
          if (!a.isPremium && b.isPremium) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategories, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    if (!isLoading && filteredProducts.length > 0) {
      setTimeout(() => {
        setContentRendered(true);
      }, 100);
    }
  }, [isLoading, filteredProducts.length]);

  useEffect(() => {
    if (contentRendered && productsGridRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentRect.height > 0) {
            setTimeout(() => {
              restoreScrollPosition();
              observer.disconnect();
            }, 100);
            break;
          }
        }
      });
      
      observer.observe(productsGridRef.current);
      
      setTimeout(() => {
        restoreScrollPosition();
        observer.disconnect();
      }, 500);
      
      return () => observer.disconnect();
    }
  }, [contentRendered, restoreScrollPosition]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    updateUrl({
      search: searchTerm,
      categories: selectedCategories,
      sort: sortBy,
      page: currentPage,
      limit: itemsPerPage
    });
  }, [searchTerm, selectedCategories, sortBy, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    saveScrollPosition();
    setCurrentPage(page);
    
    setTimeout(() => {
      const productsSection = document.querySelector('.products-section');
      if (productsSection) {
        const yOffset = -100;
        const y = productsSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    saveScrollPosition();
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return 'Kategori';
    return category.displayName || generateDisplayName(category.name);
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev => {
        if (prev.includes(categoryId)) {
          return prev.filter(id => id !== categoryId);
        } else {
          return [...prev, categoryId];
        }
      });
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleFiltersReset = () => {
    setSelectedCategories([]);
    setSortBy('premium');
    setSearchTerm('');
    setSearchExpanded(false);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DynamicSlider 
        position="products-top"
        showTitle={true}
        className="mb-12"
        fallback={null}
      />
      
      <div className="mb-6 products-section">
        <h1 className="text-3xl font-bold mb-4">Tüm Ürünler</h1>
        <p className="text-muted-foreground mb-4">
          {filteredProducts.length} ürün bulundu
        </p>
        
        <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 mb-4 sticky top-4 z-10">
          <div className="flex items-center justify-between mb-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <ItemsPerPageSelector
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                options={[12, 24, 48]}
              />
            </div>
            
            <div className="enhanced-search-container">
              <div className={`relative transition-all duration-300 ease-in-out origin-right ${
                searchExpanded ? 'w-32 xs:w-40 sm:w-48 md:w-64' : 'w-8'
              }`}>
                {searchExpanded ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ürün ara..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onBlur={() => {
                        if (!searchTerm) {
                          setSearchExpanded(false);
                        }
                      }}
                      className="pl-10 h-8 text-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchExpanded(true)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
                  >
                    <Search className="h-4 w-4 text-gray-800" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="compact-filter-button flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filtreler</span>
              </div>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('productsViewMode', 'grid');
                }}
                className="rounded-r-none h-8 px-3"
                title="Grid görünümü"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('productsViewMode', 'list');
                }}
                className="rounded-l-none h-8 px-3"
                title="Liste görünümü"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 space-y-4 overflow-x-hidden">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Kategoriler</div>
                <div className="flex flex-wrap gap-2 -mx-1">
                  <Button
                    variant={selectedCategories.length === 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryToggle('all')}
                    className="h-7 px-3 text-xs rounded-full mx-1 flex-shrink-0"
                  >
                    Tümü
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryToggle(category.id)}
                      className="h-7 px-3 text-xs rounded-full mx-1 flex-shrink-0"
                      title={category.name}
                    >
                      {category.displayName || generateDisplayName(category.name)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Sıralama</div>
                <div className="flex flex-wrap gap-2 -mx-1">
                  <Button
                    variant={sortBy === 'premium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('premium')}
                    className="h-7 px-3 text-xs rounded-full mx-1 flex-shrink-0"
                  >
                    ⭐ Premium
                  </Button>
                  <Button
                    variant={sortBy === 'newest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('newest')}
                    className="h-7 px-3 text-xs rounded-full mx-1 flex-shrink-0"
                  >
                    🆕 Yeni
                  </Button>
                  <Button
                    variant={sortBy === 'oldest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('oldest')}
                    className="h-7 px-3 text-xs rounded-full mx-1 flex-shrink-0"
                  >
                    📅 Eski
                  </Button>
                  <Button
                    variant={sortBy === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('name')}
                    className="h-7 px-3 text-xs rounded-full mx-1 flex-shrink-0"
                  >
                    🔤 A-Z
                  </Button>
                </div>
              </div>
              
              {(selectedCategories.length > 0 || sortBy !== 'premium' || searchTerm) && (
                <div className="flex items-center justify-between pt-2 border-t gap-2">
                  <div className="text-xs text-gray-500 flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1">
                      {selectedCategories.map(categoryId => (
                        <span key={categoryId} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex-shrink-0">
                          {getCategoryName(categoryId)}
                        </span>
                      ))}
                      {searchTerm && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex-shrink-0">
                          "{searchTerm}"
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFiltersReset}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 flex-shrink-0"
                  >
                    Temizle
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {filteredProducts.length > 0 && (
          <div className="text-center mb-4">
            <PaginationInfo
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredProducts.length}
              className="text-xs sm:text-sm text-gray-600"
            />
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Ürün bulunamadı</h3>
          <p className="text-muted-foreground">
            Arama kriterlerinizi değiştirip tekrar deneyin.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div ref={productsGridRef} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="group block cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <Card className="product-card-hover border-0 shadow-lg bg-white overflow-hidden h-full cursor-pointer transition-transform group-hover:scale-[1.02]">
                    <div className="similar-product-container">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="similar-product-image"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-1 px-3 md:px-6 pt-3 md:pt-6">
                      <CardTitle className="text-sm md:text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                      {product.isPremium && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800 w-fit">
                          Premium ⭐
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div ref={productsGridRef} className="space-y-4 mb-8">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="group block cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <Card className="product-card-hover border-0 shadow-lg bg-white overflow-hidden cursor-pointer transition-transform group-hover:scale-[1.01]">
                    <div className="flex flex-row">
                      <div className="w-24 sm:w-52 h-20 sm:h-36 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain bg-white p-2"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 sm:p-6">
                        <div className="flex flex-col">
                          <div className="flex-1">
                            <CardTitle className="text-sm sm:text-xl font-semibold text-gray-800 line-clamp-2 group-hover:text-green-600 transition-colors mb-2">
                              {product.name}
                            </CardTitle>
                            {product.isPremium && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-800 w-fit">
                                Premium ⭐
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
              <PaginationInfo
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredProducts.length}
                className="sm:hidden"
              />
            </div>
          )}
        </>
      )}

      {/* Product Detail Dialog */}
      {selectedProduct && productDialogOpen && (
        <ProductDetailDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          product={selectedProduct}
          onProductChange={handleProductChange}
        />
      )}
    </div>
  );
} 