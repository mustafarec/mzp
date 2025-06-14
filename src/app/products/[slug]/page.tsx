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
import { ArrowLeft, Package, Tag, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

// HTML etiketlerini temizleyen ve akıllı paragraf oluşturan utility fonksiyon
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

// Akıllı paragraf oluşturan fonksiyon
function createSmartParagraphs(text: string): string {
  if (!text) return '';
  
  // Önce HTML'i temizle
  const cleanText = stripHtml(text);
  
  // Madde işaretlerini tespit et ve yeni satırlara böl
  const bulletPatterns = /([•\-\*]\s+)/g;
  if (bulletPatterns.test(cleanText)) {
    // Madde işaretli liste varsa, her maddeyi yeni satıra böl
    return cleanText
      .replace(/([•\-\*]\s+)/g, '\n$1')
      .replace(/^\n/, '') // Başlangıçtaki boş satırı kaldır
      .trim();
  }
  
  // Parantez içi kısaltmaları korumak için geçici işaretler koy
  let processedText = cleanText;
  
  // Yaygın kısaltmaları tespit et ve koru
  processedText = processedText.replace(/\(([^)]*(?:vb|vs|örn|etc)\.[^)]*)\)/g, '{{ABBREV_$1}}');
  
  // Diğer parantez içi ifadeleri koru (Fe, Zn, Cu, Mn gibi)
  processedText = processedText.replace(/\(([A-Za-z0-9\s,]+)\)/g, '{{PAREN_$1}}');
  
  // Normal paragraf işlemi
  const sentences = processedText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Çok kısa cümleleri filtrele
  
  if (sentences.length <= 2) {
    // Geçici işaretleri geri çevir
    return cleanText
      .replace(/\{\{ABBREV_([^}]+)\}\}/g, '($1)')
      .replace(/\{\{PAREN_([^}]+)\}\}/g, '($1)');
  }
  
  // Her 2-3 cümleyi bir paragrafta grupla
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const paragraphSentences = sentences.slice(i, i + 2);
    if (paragraphSentences.length > 0) {
      // Cümle sonlarında nokta yoksa ekle
      const formattedSentences = paragraphSentences.map(s => 
        s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? s : s + '.'
      );
      paragraphs.push(formattedSentences.join(' '));
    }
  }
  
  const result = paragraphs.join('\n\n');
  
  // Geçici işaretleri geri çevir
  return result
    .replace(/\{\{ABBREV_([^}]+)\}\}/g, '($1)')
    .replace(/\{\{PAREN_([^}]+)\}\}/g, '($1)');
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
  // Akıllı paragraf oluştur
  const smartDescription = createSmartParagraphs(description);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-agriculture-primary">Ürün Açıklaması</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p className="text-agriculture-600 font-body leading-relaxed whitespace-pre-wrap">
            {smartDescription}
          </p>
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square max-w-md mx-auto overflow-hidden rounded-xl shadow-lg bg-white border border-agriculture-100">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[activeImageIndex]}
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
              {product.images.slice(0, 4).map((image, index) => (
                <div 
                  key={index} 
                  className={`relative aspect-square overflow-hidden rounded-lg shadow-sm bg-white border cursor-pointer transition-all duration-200 ${
                    activeImageIndex === index 
                      ? 'border-agriculture-500 ring-2 ring-agriculture-200' 
                      : 'border-agriculture-100 hover:border-agriculture-300'
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

        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12">
        <DescriptionCard description={product.description} />
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

