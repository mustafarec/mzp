// C:/Users/USER/OneDrive/Desktop/Projects/mzp/src/components/ui/FloatingAIChat.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, X, Send, Bot, User, Expand, Paperclip, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import ProductDetailDialog from '@/components/ui/ProductDetailDialog';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  products?: Product[];
  imageUrls?: string[];
  suggestions?: string[];
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
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Merhaba! Ben Marmara Ziraat\'in dijital bahçe danışmanıyım 🌱 Size nasıl yardımcı olabilirim?',
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        "Çimlerim neden sararıyor?",
        "Gül için gübre önerisi?",
        "Resimdeki hastalık nedir?"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ürün detay diyalogu state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleViewportChange = () => {
        if (window.visualViewport && window.visualViewport.height) {
          const viewportHeight = window.visualViewport.height;
          document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        handleViewportChange();
      }

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
        }
      };
    }
  }, []);

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
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      if (selectedImages.length < 3) {
        handleImageFile(file);
      } else {
        toast({
          title: "Maksimum Resim Sayısı",
          description: "En fazla 3 resim yükleyebilirsiniz.",
          variant: "destructive",
        });
        break;
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      if (selectedImages.length < 3) {
        handleImageFile(file);
      } else {
        toast({
          title: "Maksimum Resim Sayısı",
          description: "En fazla 3 resim yükleyebilirsiniz.",
          variant: "destructive",
        });
        break;
      }
    }
  };

  const handleImageFile = (file: File) => {
    // Maksimum resim sayısı kontrolü
    if (selectedImages.length >= 3) {
      toast({
        title: "Maksimum Resim Sayısı",
        description: "En fazla 3 resim yükleyebilirsiniz.",
        variant: "destructive",
      });
      return;
    }

    // Format kontrolü
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Geçersiz Dosya Formatı",
        description: "Lütfen bir resim dosyası seçin (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Boyut kontrolü (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Dosya Boyutu Çok Büyük",
        description: "Resim boyutu maksimum 5MB olmalıdır. Lütfen daha küçük bir resim seçin.",
        variant: "destructive",
      });
      return;
    }

    // Başarılı yükleme mesajı
    toast({
      title: "Resim Yüklendi",
      description: `${file.name} başarıyla yüklendi. ${3 - selectedImages.length - 1} resim daha yükleyebilirsiniz.`,
    });

    setSelectedImages(prev => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && selectedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || (selectedImages.length > 0 ? "Resimler hakkında sorum var" : ""),
      sender: 'user',
      timestamp: new Date(),
      imageUrls: imagePreviews.length > 0 ? [...imagePreviews] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue;
    const imagesToSend = [...selectedImages];
    const imagePreviewsToSend = [...imagePreviews];
    
    setInputValue('');
    setSelectedImages([]);
    setImagePreviews([]);
    setIsLoading(true);

    try {
      let body;
      let headers: Record<string, string> = {};

      if (imagesToSend.length > 0) {
        const formData = new FormData();
        formData.append('message', question);
        imagesToSend.forEach((image, index) => {
          formData.append(`image_${index}`, image);
        });
        formData.append('imageCount', imagesToSend.length.toString());
        
        // Optimize history - sadece text content ve sender bilgisi
        const optimizedHistory = messages.slice(-8).map(msg => ({
          sender: msg.sender,
          content: msg.content.replace(/<[^>]*>/g, '').trim(), // HTML tag'leri temizle
          timestamp: msg.timestamp
        }));
        formData.append('history', JSON.stringify(optimizedHistory));
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        // Optimize history for JSON requests too
        const optimizedHistory = messages.slice(-8).map(msg => ({
          sender: msg.sender,
          content: msg.content.replace(/<[^>]*>/g, '').trim(),
          timestamp: msg.timestamp
        }));
        
        body = JSON.stringify({
          message: question,
          history: optimizedHistory
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
      console.error('❌ AI Chat Error:', error);
      
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

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={handleOpenChat}
          data-chat-button
          className="h-14 w-14 sm:h-16 sm:w-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative group touch-manipulation"
        >
          <MoreHorizontal className="h-6 w-6 sm:h-8 sm:w-8" />
          <div className="absolute right-16 sm:right-20 top-1/2 transform -translate-y-1/2 bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
            Bahçe Danışmanı
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-green-700"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 sm:inset-auto sm:top-20 sm:right-6 sm:bottom-6 z-50 transition-all duration-300 ${
      isExpanded ? 'sm:w-[50vw]' : 'sm:w-[28rem]'
    }`}>
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur h-full flex flex-col">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <Image 
                  src="/logo.webp" 
                  alt="Marmara Ziraat" 
                  width={40} 
                  height={40}
                  className="rounded-full object-cover border-2 border-white shadow"
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" title="Online"></span>
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Bahçe Danışmanı</CardTitle>
                <Badge variant="outline" className="mt-1 h-5 border-green-200 bg-green-50 text-green-700 text-[10px] font-normal">
                  <Bot className="h-3 w-3 mr-1"/>
                  AI Destekli
                </Badge>
              </div>
            </div>
            <div className="flex items-center -mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExpand}
                className="hidden sm:flex h-8 w-8"
                title={isExpanded ? "Küçült" : "Büyüt"}
              >
                <Expand className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseChat}
                className="h-8 w-8"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 pl-4 sm:p-4 space-y-4 bg-gray-50/50 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-white border border-green-300'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Image 
                        src="/logo.webp" 
                        alt="Marmara Ziraat" 
                        width={22} 
                        height={22}
                        className="rounded-full object-contain"
                      />
                    )}
                  </div>
                  <div className={`max-w-[85%] sm:max-w-[80%] ${
                    message.sender === 'user' ? 'ml-auto' : ''
                  }`}>
                    <div className={`p-2.5 sm:p-3 rounded-xl text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}>
                      {message.sender === 'user' ? (
                        <div>
                          {message.imageUrls && message.imageUrls.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {message.imageUrls.map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`Gönderilen resim ${index + 1}`}
                                  className="max-w-[100px] sm:max-w-[120px] max-h-[80px] sm:max-h-[100px] object-cover rounded-md border border-blue-400"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ) : (
                        <div 
                          className="text-sm text-gray-800 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ul:pl-5 prose-li:my-1 prose-li:marker:text-green-600 prose-strong:font-semibold prose-strong:text-green-800"
                          dangerouslySetInnerHTML={{ 
                            __html: message.content
                          }}
                        />
                      )}
                      <span className={`text-[10px] mt-1.5 block opacity-70 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {message.sender === 'ai' && message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2.5 space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                              {message.suggestions.map((suggestion, index) => (
                                  <button
                                      key={index}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="text-xs text-left bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors text-gray-700"
                                  >
                                      {suggestion}
                                  </button>
                              ))}
                          </div>
                      </div>
                    )}
                    
                    {message.sender === 'ai' && message.products && message.products.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        <p className="text-xs text-green-700 font-medium">💡 Önerilen Ürünler:</p>
                        {message.products.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(product);
                                setProductDialogOpen(true);
                              }}
                              className="w-full text-left block bg-white border border-gray-200 rounded-lg p-2 hover:border-green-400 hover:bg-green-50/50 transition-all duration-200 shadow-sm"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-md bg-gray-100 border flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                                      <div className="absolute inset-0 bg-white hidden items-center justify-center overflow-hidden rounded-md">
                                        <Image
                                          src="/logo.webp"
                                          alt="Marmara Ziraat"
                                          width={24}
                                          height={24}
                                          className="object-contain"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-white flex items-center justify-center overflow-hidden rounded-md">
                                      <Image
                                        src="/logo.webp"
                                        alt="Marmara Ziraat"
                                        width={24}
                                        height={24}
                                        className="object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                                    {product.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                                    {product.description?.replace(/<[^>]*>/g, '').slice(0, 70)}...
                                  </p>
                                </div>
                                <div className="flex items-center justify-center h-8 w-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                  <ExternalLink className="w-4 h-4 text-gray-500" />
                                </div>
                              </div>
                            </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-white border-2 border-green-300 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                    <Image 
                      src="/logo.webp" 
                      alt="Marmara Ziraat" 
                      width={22} 
                      height={22}
                      className="rounded-full object-contain"
                    />
                  </div>
                  <div className="bg-white border shadow-sm p-3 rounded-xl">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div 
              className={`border-t bg-white relative ${isDragOver ? 'bg-green-50' : ''} fixed inset-x-0 bottom-0 z-30 sm:relative sm:bottom-auto sm:left-auto sm:right-auto shadow-[0_-2px_16px_0_rgba(0,0,0,0.08)] p-2 sm:p-3`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragOver && (
                <div className="absolute inset-0 bg-green-100/80 border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center z-10 m-2">
                  <div className="text-center">
                    <Paperclip className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-green-700">Resimleri buraya bırakın</p>
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="px-2 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 font-medium">
                        {imagePreviews.length}/3 resim
                      </span>
                      <button
                        onClick={removeAllImages}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Tümünü Kaldır
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Yüklenen resim ${index + 1}`} 
                            className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-md group-hover:opacity-80 transition-opacity"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-500 transition-all scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                </div>
              )}
              
              <div className="relative flex items-end w-full">
                <div className="flex-1 bg-gray-100 rounded-2xl flex items-end p-1.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={isLoading || selectedImages.length >= 3}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex items-center justify-center rounded-full w-9 h-9 mr-1.5 transition-colors cursor-pointer flex-shrink-0 relative ${selectedImages.length >= 3 ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-green-100 text-green-600'}`}
                    title={selectedImages.length >= 3 ? 'Maksimum 3 resim yükleyebilirsiniz' : `Fotoğraf yükle (${3 - selectedImages.length} kaldı)`}
                  >
                    <Paperclip className="h-5 w-5" />
                    {selectedImages.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-medium ring-2 ring-gray-100">
                        {selectedImages.length}
                      </span>
                    )}
                  </label>
                  <Textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Sorunuzu yazın..."
                    className="flex-1 bg-transparent border-none outline-none shadow-none resize-none text-sm px-2 py-2 focus:ring-0 focus:outline-none focus:border-none focus-visible:outline-none min-h-0 max-h-[120px] placeholder:text-gray-500"
                    style={{ minHeight: '2.25rem' }} // Corresponds to h-9
                    disabled={isLoading}
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}
                    size="icon"
                    className="ml-1.5 flex-shrink-0 w-9 h-9 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white transition-colors shadow-md"
                    aria-label="Gönder"
                    type="button"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* Ürün Detay Diyaloğu */}
        {selectedProduct && (
          <ProductDetailDialog
            open={productDialogOpen}
            onOpenChange={setProductDialogOpen}
            product={selectedProduct}
            onProductChange={(p) => setSelectedProduct(p)}
          />
        )}
      </Card>
    </div>
  );
}