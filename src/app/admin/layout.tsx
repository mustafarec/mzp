"use client";

import '@/app/globals.css';
import { Toaster } from "@/components/ui/toaster";
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminSetup from '@/components/admin/AdminSetup';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🔄 AdminLayout component rendering...');
  
  const { user, isAdmin, loading, adminEmails } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname.startsWith('/admin/login');

  useEffect(() => {
    if (isLoginPage) return;

    console.log('🔄 Admin layout effect:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
      isAdmin,
      adminEmailsCount: adminEmails.length,
      pathname
    });

    if (!loading && !user) {
      console.log('🚪 Redirecting to login - no user');
      router.push('/admin/login');
    } else if (!loading && user && !isAdmin && adminEmails.length > 0) {
      console.log('⛔ Redirecting to home - user not admin');
      router.push('/');
    }
  }, [user, isAdmin, loading, router, isLoginPage, adminEmails, pathname]);

  if (isLoginPage) {
    console.log('✅ Rendering login page children');
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

  if (!loading && user && adminEmails.length === 0) {
    return <AdminSetup currentUserEmail={user.email || undefined} />;
  }

  if (!user || !isAdmin) {
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
