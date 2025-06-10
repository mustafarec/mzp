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
    { name: 'Bahçe Danışmanı', href: '/ai-description-generator', special: true },
    { name: 'Hakkımızda', href: '/about' },
    { name: 'İletişim', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Marmara Ziraat"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-green-800">Marmara Ziraat</h1>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              item.special ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-4 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 hover:scale-105 transition-all duration-300 text-sm font-medium border border-green-200 group overflow-hidden z-10"
                >
                  <span className="relative z-20">Danışman</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-200/40 to-green-300/40 animate-pulse group-hover:animate-none opacity-75"></div>
                </Link>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-green-600 transition-colors font-medium text-sm py-2"
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>(0212) 672 99 56</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>info@marmaraziraat.com</span>
            </div>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
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