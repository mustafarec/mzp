"use client";

import '@/app/globals.css';
import { Toaster } from "@/components/ui/toaster";
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminSetup from '@/components/admin/AdminSetup';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useCallback, memo } from 'react';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, loading, adminEmails, adminCheckComplete } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  // Expensive computation memoization
  const isLoginPage = useMemo(() => 
    pathname.startsWith('/admin/login'), 
    [pathname]
  );

  const hasUser = useMemo(() => !!user, [user]);
  const userEmail = useMemo(() => user?.email, [user?.email]);
  const adminEmailsCount = useMemo(() => adminEmails.length, [adminEmails.length]);

  // Güvenli yönlendirme mantığı - sadece tam yüklendiğinde redirect yap
  useEffect(() => {
    // Login sayfasındaysa hiçbir şey yapma
    if (isLoginPage) return;
    
    // Henüz loading durumundaysa bekle
    if (loading || !adminCheckComplete) return;
    
    // Kullanıcı yoksa login'e yönlendir
    if (!hasUser) {
      router.replace('/admin/login');
      return;
    }
    
    // Admin listesi var ama kullanıcı admin değilse login'e yönlendir
    if (hasUser && !isAdmin && adminEmailsCount > 0) {
      router.replace('/admin/login');
      return;
    }
  }, [isLoginPage, loading, adminCheckComplete, hasUser, isAdmin, adminEmailsCount, router]);

  // Early returns with memoized conditions
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  // Admin setup durumu - tam yüklendiğinde kontrol et
  if (!loading && adminCheckComplete && hasUser && adminEmailsCount === 0) {
    return <AdminSetup currentUserEmail={userEmail || undefined} />;
  }

  // Yetkisiz erişim durumu - tam yüklendiğinde kontrol et
  if (!loading && adminCheckComplete && (!hasUser || (!isAdmin && adminEmailsCount > 0))) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
}

export default memo(AdminLayout);
