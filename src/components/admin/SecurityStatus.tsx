"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/useAdmin';
import { Shield, Clock, User, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SecurityStatus() {
  const { user } = useAdmin();
  const [loginTime, setLoginTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState<string>('');

  useEffect(() => {
    if (user) {
      const storedLoginTime = localStorage.getItem('adminLoginTime');
      if (!storedLoginTime) {
        const now = new Date();
        localStorage.setItem('adminLoginTime', now.toISOString());
        setLoginTime(now);
      } else {
        setLoginTime(new Date(storedLoginTime));
      }
    }
  }, [user]);

  useEffect(() => {
    const updateDuration = () => {
      if (loginTime) {
        const now = new Date();
        const diff = now.getTime() - loginTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setSessionDuration(`${hours}s ${minutes}d`);
      }
    };

    const interval = setInterval(updateDuration, 60000);
    updateDuration();

    return () => clearInterval(interval);
  }, [loginTime]);

  const getSecurityLevel = () => {
    if (!user?.email) return { level: 'Düşük', color: 'destructive' };
    
    const isAdminEmail = ['admin@marmaraziraat.com', 'info@marmaraziraat.com'].includes(user.email);
    if (isAdminEmail) {
      return { level: 'Yüksek', color: 'default' };
    }
    
    return { level: 'Orta', color: 'secondary' };
  };

  const security = getSecurityLevel();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Güvenlik Durumu</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Oturum ve güvenlik bilgileri</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Güvenlik Seviyesi</span>
          <Badge variant={security.color as any}>{security.level}</Badge>
        </div>
        
        {user && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm">Kullanıcı</span>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-sm font-mono">{user.email}</span>
              </div>
            </div>

            {loginTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Giriş Zamanı</span>
                <span className="text-sm">{loginTime.toLocaleTimeString('tr-TR')}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">Oturum Süresi</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-sm">{sessionDuration}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Son Doğrulama</span>
              <span className="text-sm">Firebase Auth</span>
            </div>
          </>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            <span>30 dakika hareketsizlik sonrası otomatik çıkış</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 