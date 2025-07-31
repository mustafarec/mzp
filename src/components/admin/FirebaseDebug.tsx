"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { migrateProductsAddPremium } from '@/lib/actions/productActions';
import { Shield, User, Database, AlertCircle, Wrench } from 'lucide-react';

export default function FirebaseDebug() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const { toast } = useToast();

  const checkFirebaseConfig = () => {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    
    const missingKeys = Object.entries(config)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      toast({
        title: 'Firebase Konfigürasyon Hatası!',
        description: `Eksik anahtarlar: ${missingKeys.join(', ')}`,
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Firebase Konfigürasyonu OK!',
      description: 'Tüm environment değişkenleri mevcut.',
    });
    return true;
  };

  const createFirstUser = async () => {
    if (!email || !password) {
      toast({
        title: 'Hata!',
        description: 'Email ve şifre gerekli',
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Hata!',
        description: 'Şifre en az 6 karakter olmalı',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      toast({
        title: 'Başarılı!',
        description: `Kullanıcı oluşturuldu: ${userCredential.user.email}`,
      });

      // Email'i admin listesine ekle
      const { setupInitialAdmin } = await import('@/lib/actions/adminActions');
      const adminResult = await setupInitialAdmin(email);
      
      if (adminResult.success) {
        toast({
          title: 'Admin Oluşturuldu!',
          description: 'Kullanıcı admin olarak ayarlandı. Giriş yapabilirsiniz.',
        });
      }

    } catch (error: any) {
      console.error('User creation error:', error);
      
      let errorMessage = 'Kullanıcı oluşturulamadı.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email adresi zaten kullanımda.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email formatı.';
      }
      
      toast({
        title: 'Hata!',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runPremiumMigration = async () => {
    setMigrationLoading(true);
    try {
      const result = await migrateProductsAddPremium();
      if (result.success) {
        toast({
          title: 'Migration Başarılı!',
          description: result.message,
        });
      } else {
        toast({
          title: 'Migration Hatası!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Hatası!',
        description: 'Migration işlemi başarısız.',
        variant: 'destructive'
      });
    } finally {
      setMigrationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Firebase Debug Paneli</CardTitle>
          </div>
          <CardDescription>Firebase konfigürasyonunu kontrol edin ve ilk kullanıcıyı oluşturun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkFirebaseConfig} variant="outline" className="w-full">
            <Database className="mr-2 h-4 w-4" />
            Firebase Konfigürasyonunu Kontrol Et
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-green-500" />
            <CardTitle>Premium Ürün Migration</CardTitle>
          </div>
          <CardDescription>Mevcut ürünlere isPremium field'ını ekler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runPremiumMigration} disabled={migrationLoading} variant="outline" className="w-full">
            <Database className="mr-2 h-4 w-4" />
            {migrationLoading ? 'Migration Çalışıyor...' : 'Premium Field Migration Çalıştır'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <CardTitle>İlk Kullanıcı Oluştur</CardTitle>
          </div>
          <CardDescription>Firebase Authentication'da ilk kullanıcıyı oluşturun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="admin@marmaraziraat.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Güçlü şifre (min 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={createFirstUser} disabled={loading} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            {loading ? 'Oluşturuluyor...' : 'Kullanıcı ve Admin Oluştur'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Çözüm Adımları</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Firebase konfigürasyonunu kontrol edin</li>
            <li>İlk kullanıcıyı oluşturun (Firebase Console'dan da yapabilirsiniz)</li>
            <li>Kullanıcı oluşturulduktan sonra normal giriş yapın</li>
            <li>Bu debug panelini admin panelinden kaldırın</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 