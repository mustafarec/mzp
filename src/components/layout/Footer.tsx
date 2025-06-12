import Link from 'next/link';
import Image from 'next/image'; // Leaf yerine Image import edildi

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image 
                src="/logo.png" 
                alt="Marmara Ziraat Logo" 
                width={40} 
                height={40} 
                className="h-10 w-10"
              />
              <span className="font-bold font-headline text-2xl">Marmara Ziraat</span>
            </Link>
          </div>
          <div>
            <h3 className="font-semibold mb-4 font-headline">Hızlı Bağlantılar</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#products" className="text-muted-foreground hover:text-primary transition-colors">Ürünler</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">Hakkımızda</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">İletişim</Link></li>
              <li><Link href="/newsletter" className="text-muted-foreground hover:text-primary transition-colors">Bülten Kayıt</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 font-headline">İletişim</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="break-words">Email: info@marmaraziraat.com</li>
              <li>Telefon: (0212) 672 99 56</li>
              <li className="break-words">Adres: Bahçeşehir, Hoşdere-Bahçeşehir Yolu No:66, 34488 Başakşehir/İstanbul</li>
              <li>Çalışma Saatleri: 09:00 - 17:00</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 font-headline">Sosyal Medya</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="https://www.facebook.com/marmaraziraat" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">Facebook</Link>
              <Link href="https://www.instagram.com/marmaraziraat" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">Instagram</Link>
              <Link href="https://www.linkedin.com/company/marmaraziraat" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {currentYear} Marmara Ziraat. Tüm hakları saklıdır.</p>
            <p className="mt-1">Marmaraziraat.com.tr projesidir.</p>
          </div>
        </div>
      </div>
    </footer>
  );
  };
  
  export default Footer;