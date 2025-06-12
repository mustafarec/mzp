'use client';

import { useEffect, useState, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Mail, Star, Zap, Shield, Users, Leaf, Truck, Award, CheckCircle, Scissors, Flower, TreePine, Sprout, Bot, Lightbulb } from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPremiumProducts } from '@/lib/actions/productActions';
import type { Product, Category } from '@/types';

interface AppleScrollProps {
  children: React.ReactNode;
  className?: string;
}

function AppleScrollSection({ children, className = '' }: AppleScrollProps) {
  const [isInView, setIsInView] = useState(false);
  const id = useId();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { 
        threshold: 0.1, // Reduced from 0.3 to 0.1 for better mobile performance
        rootMargin: '50px' // Trigger animation earlier
      }
    );

    const element = document.getElementById(id);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [id]);

  return (
    <div 
      id={id}
      className={`apple-fade-in ${isInView ? 'in-view' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [premiumProducts, categoriesSnapshot] = await Promise.all([
          getPremiumProducts(),
          getDocs(query(collection(db, 'categories'), where('isActive', '==', true), limit(4)))
        ]);

        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Category[];

        setProducts(premiumProducts);
        setCategories(categoriesList);
      } catch (error) {
        console.error('Data loading error:', error);
      }
    }

    loadData();
  }, []);

  const stats = [
    { number: "25+", label: "Yıllık Deneyim" },
    { number: "50K+", label: "Mutlu Müşteri" },
    { number: "800+", label: "Bahçe Ürünü" },
    { number: "81", label: "İl Genelinde Hizmet" }
  ];

  const features = [
    {
      icon: Leaf,
      title: "Organik & Çevre Dostu",
      description: "Doğa dostu organik gübreler ve çevre sağlığına zarar vermeyen bahçe ürünleri."
    },
    {
      icon: Truck,
      title: "Hızlı Teslimat",
      description: "Türkiye genelinde güvenli ambalajlama ile hızlı teslimat hizmeti."
    },
    {
      icon: Shield,
      title: "Kalite Garantisi",
      description: "Tüm bahçe ürünlerimiz kalite standartlarına uygun ve garanti kapsamındadır."
    },
    {
      icon: Users,
      title: "Müşteri Desteği",
      description: "Ürün seçimi ve kullanımı konusunda detaylı bilgilendirme ve destek."
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Apple-style Hero Section */}
      <section className="apple-section bg-agriculture-primary">
        <div className="absolute inset-0 apple-parallax">
          <Image
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2070"
            alt="Bahçe Peyzajı"
            fill
            priority
            className="object-cover opacity-70"
          />
        </div>
        <div className="relative container mx-auto text-center px-4 py-8 sm:py-12">
          <Badge className="mb-6 sm:mb-8 apple-glass text-white border-white/30 text-xs sm:text-sm">
            🌱 Türkiye'nin En Kapsamlı Bahçe Kataloğu
          </Badge>
          <h1 className="apple-hero-text text-white mb-6 sm:mb-8">
            Hayalinizdeki{' '}
            <span className="text-agriculture-light">Bahçe</span>
          </h1>
          <p className="apple-hero-subtext text-agriculture-light mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            Marmara Ziraat ile bahçenizi güzelleştirin. Premium kalitede çim tohumu, gübre ve bahçe ürünleri.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
            <Button 
              size="lg" 
              className="apple-button bg-white text-agriculture-primary hover:bg-agriculture-light hover:text-agriculture-700 text-sm sm:text-base font-semibold"
              asChild
            >
              <Link href="/products">
                Ürünleri Keşfet <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="apple-button border-2 border-white bg-white/10 text-white hover:bg-white hover:text-agriculture-primary backdrop-blur-sm text-sm sm:text-base font-semibold"
              asChild
            >
              <Link href="/contact">İletişim</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <AppleScrollSection>
        <section className="py-16 sm:py-20 md:py-24 bg-agriculture-primary text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="space-y-2 md:space-y-4">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold">{stat.number}</div>
                  <div className="text-sm sm:text-base md:text-lg text-agriculture-light">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AppleScrollSection>

      {/* Features Section - Apple Card Style */}
      <AppleScrollSection>
        <section className="py-20 sm:py-24 md:py-32 bg-agriculture-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="apple-hero-text text-agriculture-primary mb-6">
                Neden <span className="text-agriculture-accent">Marmara Ziraat</span>?
              </h2>
              <p className="apple-hero-subtext text-agriculture-600 max-w-3xl mx-auto">
                25 yıllık deneyimimiz ve kaliteli ürünlerimizle bahçenizi hayallerinize dönüştürün.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="apple-card-hover border-0 shadow-lg bg-white">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-agriculture-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-agriculture-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-headline text-agriculture-primary">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-agriculture-600 text-center leading-relaxed font-body text-sm sm:text-base">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AppleScrollSection>

      {/* Products Section */}
      <AppleScrollSection>
        <section className="py-20 sm:py-24 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-20">
              <Badge className="mb-6 bg-agriculture-100 text-agriculture-primary hover:bg-agriculture-200">
                Öne Çıkan Ürünler
              </Badge>
              <h2 className="apple-hero-text text-agriculture-primary mb-6">
                Premium <span className="text-agriculture-accent">Bahçe Ürünleri</span>
              </h2>
              <p className="apple-hero-subtext text-agriculture-600 max-w-3xl mx-auto mb-12">
                En kaliteli çim tohumları, gübreler ve bahçe bakım ürünleri.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-12">
              {products.map((product) => (
                <Link
                  href={`/products/${product.slug}`}
                  key={product.id}
                  className="group block"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden product-card-hover">
                    <div className="product-image-container">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="product-image-contain group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Resim yok</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description?.replace(/<[^>]*>/g, '').slice(0, 100)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600 font-medium">
                          Premium Ürün
                        </span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Premium ⭐
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                className="apple-button bg-agriculture-primary hover:bg-agriculture-600"
                asChild
              >
                <Link href="/products">
                  Tüm Ürünleri Gör <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </AppleScrollSection>

      {/* AI Bahçe Danışmanı CTA Section */}
      <AppleScrollSection>
        <section className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072"
              alt="Teknoloji ve Digital Dünya"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/75 via-green-800/70 to-green-700/80"></div>
          </div>
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                🤖 Yapay Zeka Destekli
              </Badge>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white mb-6">
                Bahçe <span className="text-green-200">Danışmanı</span>
              </h2>
              
              <p className="text-xl sm:text-2xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Bahçe problemlerinizi paylaşın, yapay zeka teknolojimiz size en uygun ürünleri önersin. 
                Kişiselleştirilmiş çözümler ve uzman tavsiyeleri alın.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Akıllı Analiz</h3>
                  <p className="text-green-100 text-sm">Sorularınızı analiz ederek en uygun çözümleri bulur</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                    <Sprout className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Ürün Önerileri</h3>
                  <p className="text-green-100 text-sm">Sistemdeki ürünlerden size özel seçimler yapar</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Uzman Tavsiyeleri</h3>
                  <p className="text-green-100 text-sm">Profesyonel bahçıvanlık ipuçları ve öneriler</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-green-700 hover:bg-green-50 font-semibold px-8 py-4 text-lg"
                  onClick={() => {
                    const chatButton = document.querySelector('[data-chat-button]') as HTMLElement;
                    if (chatButton) {
                      chatButton.click();
                    }
                  }}
                >
                  <Bot className="mr-2 h-5 w-5" />
                  Bahçe Danışmanı'nı Dene
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-green-700 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                  asChild
                >
                  <Link href="/products">Ürünleri İncele</Link>
                </Button>
              </div>
              
              <div className="mt-8 text-green-200 text-sm">
                🌱 Ücretsiz • 🚀 Anında Sonuç • 🎯 Kişiselleştirilmiş
              </div>
            </div>
          </div>
        </section>
      </AppleScrollSection>
    </div>
  );
}
