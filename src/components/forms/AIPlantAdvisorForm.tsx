"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Phone, Mail, Upload, X } from "lucide-react";
import type { Product } from '@/types';
import Link from 'next/link';

const schema = z.object({
  question: z.string().min(10, "En az 10 karakter yazın"),
  image: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AIResult {
  aiAnalysis: string;
  recommendedProducts: Product[];
  hasResults: boolean;
}

export default function AIPlantAdvisorForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { question: "" },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const extractProductRecommendations = (aiResponse: string, availableProducts: Product[]): Product[] => {
    const recommendedProducts: Product[] = [];
    
    for (const product of availableProducts) {
      const productNameInResponse = aiResponse.toLowerCase().includes(product.name.toLowerCase());
      const productSlugInResponse = aiResponse.toLowerCase().includes(product.slug.toLowerCase());
      
      if (productNameInResponse || productSlugInResponse) {
        recommendedProducts.push(product);
      }
    }
    
    return recommendedProducts.slice(0, 4);
  };

  const formatMarkdownToHtml = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const callAIAPI = async (question: string): Promise<{ aiResponse: string; products: Product[] }> => {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: question }),
    });

    if (!response.ok) {
      throw new Error('AI API çağrısı başarısız');
    }

    const data = await response.json();
    return {
      aiResponse: data.message,
      products: data.products || []
    };
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { aiResponse, products } = await callAIAPI(data.question);
      const recommendedProducts = extractProductRecommendations(aiResponse, products);
      
      setResult({
        aiAnalysis: aiResponse,
        recommendedProducts,
        hasResults: recommendedProducts.length > 0
      });
      
      toast({
        title: "Analiz Tamamlandı",
        description: recommendedProducts.length > 0 
          ? `${recommendedProducts.length} uygun ürün bulundu`
          : "Uygun ürün bulunamadı, uzman önerisi alındı",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "AI analizi sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card className="border-green-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Bot className="w-5 h-5" />
            AI Bahçe Danışmanı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Resim Yükle (isteğe bağlı)
              </label>
              <div className="border-2 border-dashed border-green-200 rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-green-400" />
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer text-green-600 hover:text-green-500"
                      >
                        Resim seç veya sürükle
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sorununuzu detaylı açıklayın <span className="text-red-500">*</span>
              </label>
              <Textarea
                {...form.register("question")}
                placeholder="Örn: Çikolatadan dolayı gıda kurdu oluştu, tavana yuva yapmış, kelebeğe dönüşüyor..."
                className="min-h-[120px]"
              />
              {form.formState.errors.question && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.question.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI Analiz Yapıyor...
                </>
              ) : (
                "AI Uzman Danışmanlığı Al"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">AI Uzman Analizi</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-green max-w-none">
                <div 
                  className="text-green-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMarkdownToHtml(result.aiAnalysis) 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {!result.hasResults ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">Özel Danışmanlık Gerekli</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-green-700 mb-4">
                  Bu duruma özel ürün önerisi için uzmanlarımızla görüşün.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Telefon</p>
                      <p className="text-green-700">(0212) 672 99 56</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                    <Mail className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">E-posta</p>
                      <p className="text-green-700">info@marmaraziraat.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">
                  Önerilen Ürünler ({result.recommendedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.recommendedProducts.map((product) => (
                    <div key={product.id} className="ai-product-card">
                      <div className="ai-product-image-container">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="ai-product-image"
                          />
                        ) : (
                          <div className="w-full h-full bg-green-50 flex items-center justify-center">
                            <Bot className="w-8 h-8 text-green-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 text-base">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description?.replace(/<[^>]*>/g, '').slice(0, 100)}...
                        </p>
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" asChild>
                          <Link href={`/products/${product.slug}`}>
                            Ürünü İncele
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 