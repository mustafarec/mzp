'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, ChevronLeft, ChevronRight, Share2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageSticky, setIsImageSticky] = useState(true);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load additional product data when dialog opens
  useEffect(() => {
    if (!open || !product) return;

    const loadProductData = async () => {
      try {
        setActiveImageIndex(0); // Resim indeksini sıfırla

        // Kategori ve benzer ürünleri getir
        const [categoryData, relatedData] = await Promise.all([
          getCategoryById(product.categoryId),
          getRelatedProducts(product.categoryId, product.id)
        ]);

        setCategory(categoryData);
        setRelatedProducts(relatedData);
      } catch (error) {
        console.error('Ürün verileri yüklenirken hata:', error);
      }
    };

    loadProductData();
  }, [open, product]);

  // Scroll için sticky davranış kontrolü
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!descriptionRef.current) return;
    
    const scrollContainer = e.currentTarget;
    const scrollTop = scrollContainer.scrollTop;
    
    // Description elementinin container içindeki gerçek pozisyonunu hesapla
    try {
      // Method 1: offsetTop + offsetHeight kullanarak bottom pozisyonunu bul
      const descriptionBottom = descriptionRef.current.offsetTop + descriptionRef.current.offsetHeight;
      
      // Açıklama elementinin sonuna gelene kadar sticky
      if (scrollTop < descriptionBottom) {
        // Açıklama henüz bitmemiş - resim sabit kalsın
        setIsImageSticky(true);
      } else {
        // Açıklama sonu geçildi - hem resim hem açıklama normal scroll yapsın
        setIsImageSticky(false);
      }
    } catch (error) {
      console.error('Sticky scroll hesaplama hatası:', error);
      // Fallback: her zaman sticky kalsın
      setIsImageSticky(true);
    }
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

  // Benzer ürün tıklandığında işlem yap
  const handleRelatedProductClick = (relatedProduct: Product) => {
    if (onProductChange) {
      // Ürün değiştir
      onProductChange(relatedProduct);
      
      // State'leri reset et
      setActiveImageIndex(0);
      setIsImageSticky(true);
      
      // Smooth scroll to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    } else {
      // Fallback: dialog'u kapat ve yeni ürünle tekrar aç
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
            <Badge className="mt-2 bg-agriculture-100 text-agriculture-primary hover:bg-agriculture-200 w-fit">
              {category.name}
            </Badge>
          )}
        </DialogHeader>

        {/* Ana İçerik - Kaydırılabilir Alan */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-6" 
          onScroll={handleScroll}
          style={{
            maxHeight: 'calc(90vh - 120px)', // Header ve footer için alan bırak
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          <div className="space-y-6 pb-4">
            {/* Ürün Ana Bölümü */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Resim Galerisi */}
              <div className="space-y-4">
                <div 
                  className={`relative aspect-square max-w-md mx-auto overflow-hidden rounded-xl shadow-lg bg-white border border-gray-100 transition-all duration-300 ${
                    isImageSticky ? 'lg:sticky lg:top-4' : ''
                  }`}
                >
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

              {/* Ürün Bilgileri */}
              <div className="space-y-6">
                    <div>
                      {/* Ürün Açıklaması - Sticky referans noktası */}
                      <div ref={descriptionRef} className="prose max-w-none mb-4">
                        <p className="text-agriculture-600 leading-relaxed whitespace-pre-wrap text-base">
                          {createSmartParagraphs(product.description)}
                        </p>
                      </div>
                      {product.isPremium && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Premium ⭐
                        </Badge>
                      )}
                    </div>

              </div>
            </div>

            {/* Benzer Ürünler - Açıklama sonrası görünecek bölüm */}
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
        
        {/* Alt kısım - Paylaş butonu ile sabit */}
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