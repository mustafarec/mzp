"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  analyzeCategoryNames, 
  updateCategoryDisplayNames,
  consolidateCategories 
} from '@/lib/actions/categoryActions';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Archive,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface AnalysisResult {
  total: number;
  withPrefixes: Array<{
    id: string;
    name: string;
    displayName: string;
    detectedPrefix: string;
  }>;
  longNames: Array<{
    id: string;
    name: string;
    length: number;
  }>;
  duplicateDisplayNames: Array<{
    displayName: string;
    categories: Array<{ id: string; name: string; }>;
  }>;
}

export default function CategoryAnalyzePage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [consolidating, setConsolidating] = useState(false);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeCategoryNames();
      setAnalysis(result);
      toast({
        title: 'Analiz Tamamlandı!',
        description: `${result.total} kategori analiz edildi.`,
      });
    } catch (error) {
      console.error('Analiz hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Analiz sırasında bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayNames = async () => {
    setUpdating(true);
    try {
      const result = await updateCategoryDisplayNames();
      toast({
        title: 'Güncelleme Tamamlandı!',
        description: `${result.updated}/${result.analyzed} kategori güncellendi.`,
      });
      // Analizi yenile
      await runAnalysis();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Güncelleme sırasında bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const runConsolidation = async () => {
    setConsolidating(true);
    try {
      const result = await consolidateCategories();
      toast({
        title: 'Birleştirme Tamamlandı!',
        description: `${result.merged} kategori birleştirildi, ${result.deleted} boş kategori silindi.`,
      });
      // Analizi yenile
      await runAnalysis();
    } catch (error) {
      console.error('Birleştirme hatası:', error);
      toast({
        title: 'Hata!',
        description: 'Birleştirme sırasında bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setConsolidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kategoriler
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Kategori Analizi</h1>
          <p className="text-muted-foreground">
            Kategori isimlerini analiz edin ve optimize edin
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Analizi</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAnalysis} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Analiz Çalıştır
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DisplayName Güncelle</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={updateDisplayNames} 
              disabled={updating || !analysis}
              variant="outline"
              className="w-full"
            >
              {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Güncelle
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Birleştir</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runConsolidation} 
              disabled={consolidating}
              variant="destructive"
              className="w-full"
            >
              {consolidating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
              Birleştir
            </Button>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analiz Sonuçları</CardTitle>
              <CardDescription>
                Toplam {analysis.total} kategori analiz edildi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.total}</div>
                  <div className="text-sm text-blue-600">Toplam Kategori</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{analysis.withPrefixes.length}</div>
                  <div className="text-sm text-amber-600">Önek İçeren</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{analysis.longNames.length}</div>
                  <div className="text-sm text-red-600">Uzun İsimli</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {analysis.withPrefixes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Önek İçeren Kategoriler ({analysis.withPrefixes.length})
                </CardTitle>
                <CardDescription>
                  Bu kategoriler otomatik olarak temizlenebilir önekler içeriyor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.withPrefixes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Görünür ad: <span className="font-medium">{item.displayName}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-600">
                        {item.detectedPrefix}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.longNames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Uzun İsimli Kategoriler ({analysis.longNames.length})
                </CardTitle>
                <CardDescription>
                  30 karakterden uzun kategori isimleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.longNames.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium break-words">{item.name}</div>
                      </div>
                      <Badge variant="outline" className="text-red-600 ml-2">
                        {item.length} karakter
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.duplicateDisplayNames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Aynı Görünür Ada Sahip Kategoriler ({analysis.duplicateDisplayNames.length})
                </CardTitle>
                <CardDescription>
                  Bu kategoriler aynı görünür ada sahip ve birleştirilebilir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.duplicateDisplayNames.map((group, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="font-medium mb-2">
                        Görünür Ad: <span className="text-orange-600">{group.displayName}</span>
                      </div>
                      <div className="space-y-2">
                        {group.categories.map((cat) => (
                          <div key={cat.id} className="text-sm text-muted-foreground pl-4 border-l-2 border-orange-200">
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.withPrefixes.length === 0 && analysis.longNames.length === 0 && analysis.duplicateDisplayNames.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Kategoriler Optimize Edilmiş!</h3>
                <p className="text-muted-foreground">
                  Tüm kategoriler temiz ve optimize edilmiş durumda.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}