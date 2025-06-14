"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, X, Send, Bot, User, Expand, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/types';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  products?: Product[];
  imageUrl?: string;
}

const SYSTEM_PROMPT = `Sen Marmara Ziraat şirketinin uzman bahçe danışmanısın. Bu şirket:
- Bahçe ürünleri ve peyzaj malzemeleri satar
- Çim tohumu, gübre, bahçe makineleri sunar
- Bitki hastalık ilaçları ve peyzaj ürünleri satar
- Çevre dostu ve organik ürünleri destekler
- Ürün kataloğu ve satış odaklı çalışır

Görevin:
- Müşterilere bahçe sorunları için uzman danışmanlık yapmak
- Ürün önerileri vermek (sadece mevcut katalogdan)
- Türkçe konuşmak, kısa ve faydalı yanıtlar vermek
- Bitki hastalıkları, bahçe bakımı konularında rehberlik etmek
- Emin olmadığın konularda iletişim bilgilerini vermek

İletişim: 0212 672 99 56 | info@marmaraziraat.com.tr`;

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Merhaba! Marmara Ziraat Bahçe Danışmanıyım 🌱 Size nasıl yardımcı olabilirim? \n\nBahçe sorunlarınızı, bitki hastalıklarınızı anlatın, size en uygun ürünleri önereyim. Çim tohumu, gübre, ilaç ve peyzaj ürünleri konularında uzman danışmanlık veriyorum.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, isMinimized]);

  const extractProductRecommendations = (aiResponse: string, availableProducts: Product[]): Product[] => {
    const recommendedProducts: Product[] = [];
    
    for (const product of availableProducts) {
      const productNameInResponse = aiResponse.toLowerCase().includes(product.name.toLowerCase());
      const productSlugInResponse = aiResponse.toLowerCase().includes(product.slug.toLowerCase());
      
      if (productNameInResponse || productSlugInResponse) {
        recommendedProducts.push(product);
      }
    }
    
    return recommendedProducts.slice(0, 3);
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || (selectedImage ? "Resim hakkında sorum var" : ""),
      sender: 'user',
      timestamp: new Date(),
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue;
    const imageToSend = selectedImage;
    const imagePreviewToSend = imagePreview;
    
    setInputValue('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      let body;
      let headers: Record<string, string> = {};

      if (imageToSend) {
        const formData = new FormData();
        formData.append('message', question);
        formData.append('image', imageToSend);
        formData.append('history', JSON.stringify(messages.slice(-10)));
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          message: question,
          history: messages.slice(-10)
        });
      }

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      const recommendedProducts = data.products ? extractProductRecommendations(data.message, data.products) : [];
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.',
        sender: 'ai',
        timestamp: new Date(),
        products: recommendedProducts
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `AI hizmetinde geçici bir sorun var. Detaylı bilgi için (0212) 672 99 56 numaralı telefondan bize ulaşabilirsiniz.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleOpenChat}
          data-chat-button
          className="h-16 w-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative group"
        >
          <MoreHorizontal className="h-8 w-8" />
          <div className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-green-700 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Bahçe Danışmanı
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-green-700"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-[calc(100vw-2rem)] transition-all duration-300 ${
      isExpanded ? 'w-[27.6rem]' : 'w-96'
    }`}>
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Bahçe Danışmanı 🌱</CardTitle>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Uzman Danışmanlık</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleExpand}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded flex items-center justify-center"
                title={isExpanded ? "Küçült" : "Büyüt"}
              >
                <Expand className="h-4 w-4" />
              </button>
              <button
                onClick={handleCloseChat}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-green-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${
                    message.sender === 'user' ? 'ml-auto' : ''
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border shadow-sm'
                    }`}>
                      {message.sender === 'user' ? (
                        <div>
                          {message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={message.imageUrl}
                                alt="Gönderilen resim"
                                className="max-w-[200px] max-h-[150px] object-cover rounded border"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ) : (
                        <div 
                          className="text-sm prose prose-sm prose-green max-w-none [&_strong]:font-semibold [&_em]:italic [&_ul]:my-2 [&_li]:my-1"
                          dangerouslySetInnerHTML={{ 
                            __html: message.content
                          }}
                        />
                      )}
                      <span className={`text-xs mt-1 block ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    {message.sender === 'ai' && message.products && message.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-green-600 font-medium">💡 Önerilen Ürünler:</p>
                        {message.products.map((product) => (
                            <Link 
                              key={product.id} 
                              href={`/products/${product.slug}`}
                              className="block bg-green-50 border border-green-200 rounded-lg p-2 hover:bg-green-100 transition-colors"
                            >
                              <div className="flex items-start space-x-2">
                                <div className="w-10 h-10 rounded flex-shrink-0 relative overflow-hidden">
                                  {product.images && product.images.length > 0 && product.images[0] ? (
                                    <>
                                      <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          const fallback = target.nextElementSibling as HTMLElement;
                                          target.style.display = 'none';
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-green-200 hidden items-center justify-center">
                                        <Bot className="w-4 h-4 text-green-600" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-green-200 flex items-center justify-center">
                                      <Bot className="w-4 h-4 text-green-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-green-800 line-clamp-1">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-green-600 line-clamp-1">
                                    {product.description?.replace(/<[^>]*>/g, '').slice(0, 50)}...
                                  </p>
                                </div>
                                <ExternalLink className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                              </div>
                            </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-2">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border shadow-sm p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Yüklenen resim" 
                    className="max-w-[150px] max-h-[150px] rounded-lg border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <div className="flex space-x-2">
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Bahçe sorununuzu detaylı anlatın... (Örn: Çimlerimde sarı lekeler var, ne yapmalıyım?)"
                    className="w-full min-h-[40px] max-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex flex-col space-y-1 self-end">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-600 p-2 rounded cursor-pointer flex items-center justify-center"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </label>
                  
                  <button
                    onClick={sendMessage}
                    disabled={(!inputValue.trim() && !selectedImage) || isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white p-2 rounded"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                🌱 AI Bahçe Danışmanı • Uzman Öneriler • Ürün Tavsiyeleri
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
} 