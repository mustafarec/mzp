'use client';

import { useState, useEffect } from 'react';
import { X, Package, Tag, Calendar, ChevronLeft, ChevronRight, Share2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import type { Product, Category } from '@/types';

// HTML etiketlerini temizleyen ve akıllı paragraf oluşturan utility fonksiyon
function stripHtml(html: string): string {
  const stripped = html.replace(/<[^>]*>/g, '');
  const decoded = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.replace(/\s+/g, ' ').trim();
}

function createSmartParagraphs(text: string): string {
  if (!text) return '';
  const cleanText = stripHtml(text);
  const bulletPatterns = /([•\-\*]\s+)/g;
  if (bulletPatterns.test(cleanText)) {
    return cleanText
      .replace(/([•\-\*]\s+)/g, '\n$1')
      .replace(/^\n/, '')
      .trim();
  }
  
  let processedText = cleanText;
  processedText = processedText.replace(/\(([^)]*(?:vb|vs|örn|etc)\.[^)]*)\)/g, '{{ABBREV_$1}}');
  processedText = processedText.replace(/\(([A-Za-z0-9\s,]+)\)/g, '{{PAREN_$1}}');
  
  const sentences = processedText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  if (sentences.length <= 2) {
    return cleanText
      .replace(/\{\{ABBREV_([^}]+)\}\}/g, '($1)')
      .replace(/\{\{PAREN_([^}]+)\}\}/g, '($1)');
  }
  
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const paragraphSentences = sentences.slice(i, i + 2);
    if (paragraphSentences.length > 0) {
      const formattedSentences = paragraphSentences.map(s => 
        s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? s : s + '.'
      );
      paragraphs.push(formattedSentences.join(' '));
    }
  }
  
  const result = paragraphs.join('\n\n');
  return result
    .replace(/\{\{ABBREV_([^}]+)\}\}/g, '($1)')
    .replace(/\{\{PAREN_([^}]+)\}\}/g, '($1)');
}

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onProductChange?: (product: Product) => void;
}

export default function ProductDetailDialog({ open, onOpenChange, product, onProductChange }: ProductDetailDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Set mobile device detection after mount
    setIsMobileDevice(window.innerWidth < 768);

    // Listen for resize events to update mobile state
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load additional product data when dialog opens
  useEffect(() => {
    if (!open || !product) return;

    const loadProductData = async () => {
      try {
        setLoading(true);
        setActiveImageIndex(0); // Reset image index
        setScrollY(0); // Reset scroll position
        setImageScale(1); // Reset image scale

        // Fetch category and related products
        const [categoryData, relatedData] = await Promise.all([
          getCategoryById(product.categoryId),
          getRelatedProducts(product.categoryId, product.id)
        ]);

        setCategory(categoryData);
        setRelatedProducts(relatedData);
      } catch (error) {
        console.error('Error loading product data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [open, product]);

  // Handle scroll for image scaling animation
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Responsive scroll parameters using state instead of direct window access
    const maxScroll = isMobileDevice ? 150 : 200; // Mobilde daha erken durdur
    const minScale = isMobileDevice ? 0.7 : 0.6; // Mobilde daha az küçült
    
    // Smooth easing function for more natural animation
    const progress = Math.min(scrollTop / maxScroll, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    const scale = 1 - (easedProgress * (1 - minScale));
    
    setScrollY(scrollTop);
    setImageScale(scale);
  };

  // Handle image navigation
  const handlePrevImage = () => {
    if (product.images && product.images.length > 1) {
      setActiveImageIndex(prev => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (product.images && product.images.length > 1) {
      setActiveImageIndex(prev => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Share functionality
  const shareProduct = async () => {
    const shareData = {
      title: product.name,
      text: `${product.name} - ${stripHtml(product.description).slice(0, 100)}...`,
      url: `${window.location.origin}/products/${product.slug}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`);
        alert('Link panoya kopyalandı!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle product click for related products
  const handleRelatedProductClick = (relatedProduct: Product) => {
    if (onProductChange) {
      // Use callback to change product in dialog
      onProductChange(relatedProduct);
    } else {
      // Fallback: close dialog and reopen with new product
      onOpenChange(false);
      setTimeout(() => {
        // Note: This requires parent component to handle product switching
        console.warn('onProductChange callback not provided for product switching');
      }, 300);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-left">
            {product.name}
          </DialogTitle>
          {category && (
            <DialogDescription className="text-left">
              {category.name}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Main Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6" style={{
          maxHeight: 'calc(90vh - 120px)', // Account for header and footer
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}>
          <div className="space-y-6 pb-4">
            {/* Product Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square max-w-md mx-auto overflow-hidden rounded-xl shadow-lg bg-white border border-gray-100">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <Image
                            src={product.images[activeImageIndex]}
                            alt={product.name}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                          
                          {/* Image navigation arrows */}
                          {product.images.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                                onClick={handlePrevImage}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                                onClick={handleNextImage}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                {/* Thumbnail Gallery */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                        {product.images.slice(0, 4).map((image, index) => (
                          <div 
                            key={index} 
                            className={`relative aspect-square overflow-hidden rounded-lg shadow-sm bg-white border cursor-pointer transition-all duration-200 ${
                              activeImageIndex === index 
                                ? 'border-agriculture-500 ring-2 ring-agriculture-200' 
                                : 'border-gray-100 hover:border-agriculture-300'
                            }`}
                            onClick={() => setActiveImageIndex(index)}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} - ${index + 1}`}
                              fill
                              className="object-contain p-2 hover:scale-105 transition-transform duration-200"
                              sizes="80px"
                            />
                          </div>
                        ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                    <div>
                      {category && (
                        <Badge className="mb-3 bg-agriculture-100 text-agriculture-primary hover:bg-agriculture-200">
                          {category.name}
                        </Badge>
                      )}
                      <h1 className="text-2xl sm:text-3xl font-bold text-agriculture-primary mb-4">
                        {product.name}
                      </h1>
                      {product.isPremium && (
                        <Badge className="mb-4 bg-yellow-100 text-yellow-800">
                          Premium ⭐
                        </Badge>
                      )}
                    </div>

                    {/* Product Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-agriculture-primary text-lg">
                          <Package className="h-5 w-5" />
                          Ürün Detayları
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {product.sku && (
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">SKU:</span>
                            <span className="text-muted-foreground">{product.sku}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Eklenme:</span>
                          <span className="text-muted-foreground">
                            {product.createdAt.toLocaleDateString('tr-TR')}
                          </span>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div>
                            <span className="font-medium text-sm mb-2 block">Etiketler:</span>
                            <div className="flex flex-wrap gap-2">
                              {product.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
              </div>
            </div>

            {/* Product Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-agriculture-primary">Ürün Açıklaması</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-agriculture-600 leading-relaxed whitespace-pre-wrap">
                    {createSmartParagraphs(product.description)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div>
                <Separator className="mb-6" />
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-agriculture-primary mb-2">
                    Benzer Ürünler
                  </h3>
                  <p className="text-agriculture-600 text-sm">
                    Aynı kategoriden diğer ürünleri keşfedin
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <Card key={relatedProduct.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <div className="aspect-square relative bg-gray-50 rounded-t-lg overflow-hidden">
                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                          <Image
                            src={relatedProduct.images[0]}
                            alt={relatedProduct.name}
                            fill
                            className="object-contain p-2"
                            sizes="200px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2">
                          {relatedProduct.name}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                          {stripHtml(relatedProduct.description).slice(0, 60)}...
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => handleRelatedProductClick(relatedProduct)}
                        >
                          Detayları Gör
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with share button - Fixed at bottom */}
        <div className="border-t bg-white p-4 mt-auto">
          <div className="flex justify-center">
            <Button variant="outline" onClick={shareProduct}>
              <Share2 className="mr-2 h-4 w-4" />
              Paylaş
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for data fetching
async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (categoryDoc.exists()) {
      const data = categoryDoc.data();
      return {
        id: categoryDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Category;
    }
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getRelatedProducts(categoryId: string, currentProductId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef, 
      where('categoryId', '==', categoryId),
      where('isActive', '==', true),
      limit(4)
    );
    const querySnapshot = await getDocs(q);
    
    const products = querySnapshot.docs
      .filter(doc => doc.id !== currentProductId)
      .slice(0, 3)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as Product;
      });
    
    return products;
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}