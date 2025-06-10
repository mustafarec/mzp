"use client";

import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Product, Category } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, Tag, Calendar, Share2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

// HTML etiketlerini temizleyen utility fonksiyon
function stripHtml(html: string): string {
  // HTML etiketlerini kaldır
  const stripped = html.replace(/<[^>]*>/g, '');
  
  // HTML entities'leri decode et
  const decoded = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
    
  // Fazla boşlukları temizle
  return decoded.replace(/\s+/g, ' ').trim();
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('slug', '==', slug), where('isActive', '==', true), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const productDoc = querySnapshot.docs[0];
    const data = productDoc.data();
    
    return {
      id: productDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

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

function DescriptionCard({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // HTML etiketlerini temizle
  const cleanDescription = stripHtml(description);
  
  const maxLength = 300;
  const shouldTruncate = cleanDescription.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? cleanDescription.substring(0, maxLength) + '...'
    : cleanDescription;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-agriculture-primary">Ürün Açıklaması</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p className="text-agriculture-600 font-body leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 p-0 h-auto text-agriculture-primary hover:text-agriculture-600"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Daha Az Göster
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Devamını Oku
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    async function initParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }
    initParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    
    async function loadData() {
      try {
        const fetchedProduct = await getProductBySlug(slug);
        
        if (!fetchedProduct) {
          notFound();
          return;
        }

        setProduct(fetchedProduct);

        const [fetchedCategory, fetchedRelated] = await Promise.all([
          getCategoryById(fetchedProduct.categoryId),
          getRelatedProducts(fetchedProduct.categoryId, fetchedProduct.id)
        ]);

        setCategory(fetchedCategory);
        setRelatedProducts(fetchedRelated);
      } catch (error) {
        console.error('Error loading product data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agriculture-primary mx-auto mb-4"></div>
            <p className="text-agriculture-600">Ürün yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">Ürünler</Link>
        <span>/</span>
        {category && (
          <>
            <span className="hover:text-primary">{category.name}</span>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/products" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Ürünlere Geri Dön
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square max-w-md mx-auto overflow-hidden rounded-xl shadow-lg bg-white border border-agriculture-100">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            ) : (
              <div className="w-full h-full bg-agriculture-100 flex items-center justify-center">
                <Package className="h-24 w-24 text-agriculture-300" />
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {product.images.slice(1, 5).map((image, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg shadow-sm bg-white border border-agriculture-100">
                  <Image
                    src={image}
                    alt={`${product.name} - ${index + 2}`}
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
            <h1 className="text-4xl font-headline font-bold text-agriculture-primary mb-4">
              {product.name}
            </h1>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-agriculture-primary">
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

          {/* Description */}
          <DescriptionCard description={product.description} />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1 bg-agriculture-primary hover:bg-agriculture-600">
              <Eye className="h-4 w-4 mr-2" />
              Detaylı İnceleme
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Paylaş
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <Separator className="mb-8" />
          <div className="text-center mb-8">
            <h2 className="text-3xl font-headline text-agriculture-primary mb-4">
              Benzer Ürünler
            </h2>
            <p className="text-agriculture-600 font-body">
              Aynı kategoriden diğer ürünleri keşfedin
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="product-card-hover border-0 shadow-lg bg-white overflow-hidden">
                <div className="similar-product-container">
                  {relatedProduct.images && relatedProduct.images.length > 0 ? (
                    <img
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.name}
                      className="similar-product-image"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                    {relatedProduct.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {relatedProduct.description?.replace(/<[^>]*>/g, '').slice(0, 80)}...
                  </p>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700" size="sm">
                    <Link href={`/products/${relatedProduct.slug}`}>
                      Detayları Gör
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

