'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, ArrowLeft, Bot } from 'lucide-react';

export default function AIPlantAdvisorPage() {
  const router = useRouter();

  const openChat = () => {
    router.push('/');
    setTimeout(() => {
      const chatButton = document.querySelector('[data-chat-button]') as HTMLElement;
      if (chatButton) {
        chatButton.click();
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto border-green-200 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                Bahçe Danışmanı 🌱
              </h1>
              <p className="text-green-600">
                Artık chat botumuz üzerinden hizmet veriyor!
              </p>
            </div>
            
            <p className="text-sm text-gray-600">
              Bahçe sorularınız için sağ alt köşedeki chat butonunu kullanın. 
              Anında uzman tavsiyeleri ve ürün önerileri alın.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={openChat}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat Danışmanı'nı Aç
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
