import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ConditionalAIChat from '@/components/layout/ConditionalAIChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Marmara Ziraat - Bahçe Ürünleri & Peyzaj Malzemeleri',
  description: 'Çim tohumu, gübre, bahçe makineleri, bitki hastalık ilaçları ve peyzaj malzemeleri. Marmaraziraat.com.tr bahçe ürünleri kataloğu.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <ConditionalAIChat />
        <Toaster />
      </body>
    </html>
  );
}
