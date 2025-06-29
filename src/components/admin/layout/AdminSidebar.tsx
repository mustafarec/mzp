'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, FolderTree, Settings, LogOut, Shield, FileText, ImageIcon, Layout, BookOpen, Images } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { memo, useCallback, useMemo } from 'react';

const navigation = [
  {
    name: 'Gösterge Paneli',
    href: '/admin',
    icon: Home,
  },
  {
    name: 'Sayfa Yönetimi',
    href: '/admin/pages',
    icon: FileText,
  },
  {
    name: 'Widget Yönetimi',
    href: '/admin/widgets',
    icon: Layout,
  },
  {
    name: 'Slider Yönetimi',
    href: '/admin/sliders',
    icon: Images,
  },
  {
    name: 'Medya Kütüphanesi',
    href: '/admin/media',
    icon: ImageIcon,
  },
  {
    name: 'Ürün Yönetimi',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Kategori Yönetimi',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    name: 'Katalog Yönetimi',
    href: '/admin/catalogs',
    icon: BookOpen,
  },
  {
    name: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAdmin();

  // Memoize user email
  const userEmail = useMemo(() => user?.email, [user?.email]);

  // Memoized logout handler
  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('adminRememberMe');
      localStorage.removeItem('adminEmail');
      toast({ title: 'Çıkış Başarılı!', description: 'Giriş sayfasına yönlendiriliyorsunuz.' });
      router.push('/admin/login');
    } catch (error) {
      toast({ title: 'Çıkış Hatası!', description: 'Çıkış yapılamadı.', variant: 'destructive' });
    }
  }, [toast, router]);

  return (
    <div className="hidden border-r bg-white lg:block lg:w-64 lg:shrink-0">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.webp" alt="Logo" width={28} height={28} />
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info & Logout */}
        <div className="border-t p-4 space-y-3">
          {userEmail && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
              <Shield className="h-4 w-4" />
              <span className="truncate">{userEmail}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(AdminSidebar); 