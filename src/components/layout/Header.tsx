'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, Phone, Mail, Bot, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'Ürünler', href: '/products' },
    { name: 'Kataloglar', href: '/catalogs' },
    { name: 'Bahçe Danışmanı', href: '/ai-description-generator', special: true },
    { name: 'Hakkımızda', href: '/about' },
    { name: 'İletişim', href: '/contact' },
  ];

  // Mobil menü açıkken scroll'u engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95 relative">
      {/* Top Bar */}
      <div className="bg-green-600 text-white py-1 text-xs overflow-hidden">
        <div className="relative">
          <div className="animate-marquee whitespace-nowrap flex items-center">
            <span className="mr-8">⏰ Hafta içi & Cumartesi: 08:00-18:00  •  Pazar: 09:00-16:00  •  🌱 25+ Yıllık Deneyim  •  Bahçe Ürünleri & Peyzaj Çözümleri  •  📞 (0212) 672 99 56  •  📧 info@marmaraziraat.com</span>
            <span className="mr-8">⏰ Hafta içi & Cumartesi: 08:00-18:00  •  Pazar: 09:00-16:00  •  🌱 25+ Yıllık Deneyim  •  Bahçe Ürünleri & Peyzaj Çözümleri  •  📞 (0212) 672 99 56  •  📧 info@marmaraziraat.com</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-h-16">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Image
              src="/logo.webp"
              alt="Marmara Ziraat"
              width={40}
              height={40}
              className="rounded-lg sm:w-12 sm:h-12"
            />
            <div className="hidden xs:block">
              <h1 className="text-lg sm:text-xl font-bold text-green-800 whitespace-nowrap">Marmara Ziraat</h1>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 flex-1 justify-center">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return item.special ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-3 xl:px-4 py-2 rounded-full hover:scale-105 transition-all duration-300 text-xs xl:text-sm font-medium border group overflow-hidden z-10 whitespace-nowrap ${
                    isActive 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  }`}
                >
                  <span className="relative z-20">Danışman</span>
                  {!isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-200/40 to-green-300/40 animate-pulse group-hover:animate-none opacity-75"></div>
                  )}
                </Link>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors font-medium text-xs xl:text-sm py-2 px-3 rounded-full whitespace-nowrap ${
                    isActive 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden xl:flex items-center gap-3 2xl:gap-4 flex-shrink-0">
            <a 
              href="tel:+902126729956" 
              className="flex items-center gap-2 text-xs 2xl:text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="whitespace-nowrap">(0212) 672 99 56</span>
            </a>
            <a 
              href="mailto:info@marmaraziraat.com" 
              className="flex items-center gap-2 text-xs 2xl:text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="whitespace-nowrap">info@marmaraziraat.com</span>
            </a>
          </div>

          {/* Mobil Menü Trigger */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden flex-shrink-0"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile Dropdown Menu */}
          {isOpen && (
            <>
              {/* Backdrop for closing menu */}
              <div 
                className="fixed inset-0 z-40 lg:hidden"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border-t lg:hidden mobile-dropdown-enter">
                {/* Navigation */}
                <nav className="py-4">
                  <div className="container mx-auto px-4 space-y-1">
                    {navigation.map((item, index) => {
                      const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                      
                      return item.special ? (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 mobile-menu-item-enter ${
                            isActive 
                              ? 'text-white bg-green-600' 
                              : 'text-green-700 bg-green-50/70 hover:bg-green-100/70'
                          }`}
                          style={{ 
                            animationDelay: `${index * 60}ms`
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <Bot className="h-5 w-5" />
                            {item.name}
                          </span>
                        </Link>
                      ) : (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 mobile-menu-item-enter ${
                            isActive 
                              ? 'text-white bg-green-600' 
                              : 'text-gray-700 hover:text-green-600 hover:bg-gray-50/50'
                          }`}
                          style={{ 
                            animationDelay: `${index * 60}ms`
                          }}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Contact Info */}
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                  <div className="container mx-auto">
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <a 
                        href="tel:+902126729956"
                        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>(0212) 672 99 56</span>
                      </a>
                      <a 
                        href="mailto:info@marmaraziraat.com"
                        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span>info@marmaraziraat.com</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}