"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getMediaList, uploadMedia, deleteMedia } from '@/lib/actions/mediaActions';
import type { Media } from '@/types';
import { 
  Upload, 
  ImageIcon, 
  FileVideo, 
  FileText, 
  Trash2, 
  Search,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Media['type'] | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, [typeFilter]);

  const loadMedia = async () => {
    try {
      const result = await getMediaList(1, 50, typeFilter === 'all' ? undefined : typeFilter);
      if (result.success) {
        setMedia(result.media);
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Medya yüklenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);
    
    const totalFiles = files.length;
    let completedFiles = 0;
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadMedia(file);
        completedFiles++;
        const progress = Math.round((completedFiles / totalFiles) * 100);
        setUploadProgress(progress);
        return result;
      });
      
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast({
          title: 'Başarılı!',
          description: `${successCount} dosya yüklendi.`
        });
        loadMedia();
      }
      
      const failCount = results.length - successCount;
      if (failCount > 0) {
        toast({
          title: 'Uyarı!',
          description: `${failCount} dosya yüklenemedi.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Hata!',
        description: 'Dosya yüklenirken hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;
    
    const result = await deleteMedia(id);
    if (result.success) {
      toast({
        title: 'Başarılı!',
        description: result.message
      });
      setMedia(media.filter(m => m.id !== id));
    } else {
      toast({
        title: 'Hata!',
        description: result.message,
        variant: 'destructive'
      });
    }
  };

  const filteredMedia = media.filter(item =>
    item.originalName.toLowerCase().includes(search.toLowerCase()) ||
    item.alt?.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: Media['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <FileVideo className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medya Kütüphanesi</h1>
          <p className="text-muted-foreground">
            Resimleri, videoları ve dosyaları yönetin
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Dosya Yükle
            </>
          )}
        </Button>
      </div>

      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Dosyalar yükleniyor...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Dosya ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value: Media['type'] | 'all') => setTypeFilter(value)}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="image">Resimler</SelectItem>
            <SelectItem value="video">Videolar</SelectItem>
            <SelectItem value="document">Dökümanlar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={item.alt || item.originalName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getFileIcon(item.type)}
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{item.originalName}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(item.size)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredMedia.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz dosya yok</h3>
            <p className="text-muted-foreground mb-4">
              İlk dosyanızı yükleyerek başlayın
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Dosya Yükle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 