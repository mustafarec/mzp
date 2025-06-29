"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { setupInitialAdmin } from '@/lib/actions/adminActions';
import { Shield, UserPlus } from 'lucide-react';

interface AdminSetupProps {
  currentUserEmail?: string;
}

export default function AdminSetup({ currentUserEmail }: AdminSetupProps) {
  const [email, setEmail] = useState(currentUserEmail || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    if (!email.trim()) {
      toast({
        title: 'Hata!',
        description: 'Email adresi gerekli',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await setupInitialAdmin(email);
      
      if (result.success) {
        toast({
          title: 'Başarılı!',
          description: 'İlk admin oluşturuldu. Sayfa yenileniyor...'
        });
        
        // Sayfa yenileme ile admin kontrolünü tetikle
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Hata!',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Hata!',
        description: error.message || 'Bir hata oluştu',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Admin Sistemi Kurulumu</CardTitle>
          <CardDescription>
            İlk admin kullanıcısını oluşturmak için email adresinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@marmaraziraat.com"
              disabled={loading}
            />
          </div>
          
          <Button 
            onClick={handleSetup} 
            className="w-full" 
            disabled={loading}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? 'Oluşturuluyor...' : 'İlk Admin\'i Oluştur'}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Bu email adresi admin paneline tam erişim yetkisi alacak
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 