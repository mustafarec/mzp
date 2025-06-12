'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Phone, Mail, Bot } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'Ürünler', href: '/products' },
    { name: 'Kataloglar', href: '/catalogs' },
    { name: 'Bahçe Danışmanı', href: '/ai-description-generator', special: true },
    { name: 'Hakkımızda', href: '/about' },
    { name: 'İletişim', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-h-16">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Image
              src="/logo.png"
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
            {navigation.map((item) => (
              item.special ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-3 xl:px-4 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 hover:scale-105 transition-all duration-300 text-xs xl:text-sm font-medium border border-green-200 group overflow-hidden z-10 whitespace-nowrap"
                >
                  <span className="relative z-20">Danışman</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-200/40 to-green-300/40 animate-pulse group-hover:animate-none opacity-75"></div>
                </Link>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-green-600 transition-colors font-medium text-xs xl:text-sm py-2 whitespace-nowrap"
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-3 2xl:gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs 2xl:text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span className="whitespace-nowrap">(0212) 672 99 56</span>
            </div>
            <div className="flex items-center gap-2 text-xs 2xl:text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="whitespace-nowrap">info@marmaraziraat.com</span>
            </div>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden flex-shrink-0">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle className="sr-only">Mobil Menü</SheetTitle>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Image
                    src="/logo.png"
                    alt="Marmara Ziraat"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <h2 className="font-bold text-green-800">Marmara Ziraat</h2>
                  </div>
                </div>
                
                <nav className="flex flex-col space-y-2">
                  {navigation.map((item) => (
                    item.special ? (
                      <Button
                        key={item.name}
                        asChild
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 hover:scale-105 text-white justify-start transition-all duration-300 group overflow-hidden"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href={item.href} className="relative">
                          <span className="relative z-20">{item.name}</span>
                          <div className="absolute inset-0 rounded bg-gradient-to-r from-green-400/40 to-green-500/40 animate-pulse group-hover:animate-none opacity-75"></div>
                        </Link>
                      </Button>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="text-gray-600 hover:text-green-600 transition-colors font-medium py-2"
                      >
                        {item.name}
                      </Link>
                    )
                  ))}
                </nav>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>(0212) 672 99 56</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>info@marmaraziraat.com</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}