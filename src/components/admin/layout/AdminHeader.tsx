"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { LogOut, Clock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';

export default function AdminHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAdmin();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [sessionWarning, setSessionWarning] = useState(false);

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 dakika
  const WARNING_TIME = 5 * 60 * 1000; // 5 dakika uyarı

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
      setSessionWarning(false);
    };

    const checkSession = () => {
      const timeSinceActivity = Date.now() - lastActivity.getTime();
      
      if (timeSinceActivity > SESSION_TIMEOUT) {
        handleLogout();
        toast({ 
          title: 'Oturum Zaman Aşımı!', 
          description: 'Güvenlik nedeniyle oturumunuz sonlandırıldı.', 
          variant: 'destructive' 
        });
      } else if (timeSinceActivity > SESSION_TIMEOUT - WARNING_TIME) {
        setSessionWarning(true);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => document.addEventListener(event, updateActivity, true));

    const sessionInterval = setInterval(checkSession, 60000); // Her dakika kontrol

    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity, true));
      clearInterval(sessionInterval);
    };
  }, [lastActivity]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('adminRememberMe');
      localStorage.removeItem('adminEmail');
      toast({ title: 'Çıkış Başarılı!', description: 'Giriş sayfasına yönlendiriliyorsunuz.' });
      router.push('/admin/login');
    } catch (error) {
      console.error("Logout Error:", error);
      toast({ title: 'Çıkış Hatası!', description: 'Çıkış yapılamadı.', variant: 'destructive' });
    }
  };

  const extendSession = () => {
    setLastActivity(new Date());
    setSessionWarning(false);
    toast({ title: 'Oturum Uzatıldı!', description: 'Oturumunuz 30 dakika daha uzatıldı.' });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold">
            <Image src="/logo.png" alt="Marmara Ziraat Admin" width={32} height={32} />
            <span>Admin Paneli</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sessionWarning && (
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <Clock className="h-4 w-4" />
              <span>Oturum yakında sona erecek!</span>
              <Button variant="outline" size="sm" onClick={extendSession}>
                Uzat
              </Button>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </header>
      
      {sessionWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Güvenlik nedeniyle oturumunuz 5 dakika içinde sonlanacak. 
                <Button variant="link" onClick={extendSession} className="p-0 ml-1 h-auto">
                  Oturumu uzatmak için tıklayın.
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
