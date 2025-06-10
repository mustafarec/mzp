
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Gösterge Paneli', icon: Home },
  { href: '/admin/products', label: 'Ürün Yönetimi', icon: Package },
  // Add more admin navigation items here
  // { href: '/admin/categories', label: 'Kategori Yönetimi', icon: FolderTree },
  // { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-col border-r bg-card p-4 md:flex">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
              pathname === item.href && "bg-muted text-primary"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
