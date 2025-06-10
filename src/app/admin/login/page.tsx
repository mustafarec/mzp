// src/app/admin/login/page.tsx
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      if (rememberMe) {
        localStorage.setItem('adminRememberMe', 'true');
        localStorage.setItem('adminEmail', email);
      } else {
        localStorage.removeItem('adminRememberMe');
        localStorage.removeItem('adminEmail');
      }
      
      toast({ title: 'Giriş Başarılı!', description: 'Yönetim paneline yönlendiriliyorsunuz.' });
      router.push('/admin');
    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMessage = "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = "E-posta veya şifre hatalı.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Geçersiz e-posta formatı.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Çok fazla yanlış deneme. Lütfen daha sonra tekrar deneyin.";
      }
      setError(errorMessage);
      toast({ title: 'Giriş Başarısız!', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ title: 'E-posta Gerekli!', description: 'Şifre sıfırlamak için e-posta adresinizi girin.', variant: 'destructive' });
      return;
    }

    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Şifre Sıfırlama!', description: 'Şifre sıfırlama linki e-postanıza gönderildi.' });
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Şifre sıfırlama e-postası gönderilemedi.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.";
      }
      toast({ title: 'Hata!', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Admin Girişi</CardTitle>
          <CardDescription className="text-center">Marmara Ziraat Yönetim Paneli</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@marmaraziraat.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm">Beni hatırla</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Giriş Yap'}
            </Button>

            <Button 
              type="button" 
              variant="link" 
              onClick={handlePasswordReset}
              disabled={isResetLoading}
              className="w-full text-sm"
            >
              {isResetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Şifremi Unuttum'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
