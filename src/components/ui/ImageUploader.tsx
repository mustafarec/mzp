"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadOptimizedImage, validateImageFile, formatFileSize } from '@/lib/firebase-storage';
import Image from 'next/image';

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  folder: string;
  existingImages?: string[];
  className?: string;
}

export default function ImageUploader({ 
  onUpload, 
  maxFiles = 5, 
  folder, 
  existingImages = [],
  className = "" 
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const totalFiles = images.length + fileArray.length;

    if (totalFiles > maxFiles) {
      toast({
        title: 'Dosya Limiti',
        description: `En fazla ${maxFiles} resim yükleyebilirsiniz.`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of fileArray) {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          toast({
            title: 'Geçersiz Dosya',
            description: validation.error,
            variant: 'destructive'
          });
          continue;
        }

        const fileName = `${Date.now()}_${file.name}`;
        const path = `${folder}/${fileName}`;
        
        const url = await uploadOptimizedImage(file, path);
        newUrls.push(url);
      }

      const updatedImages = [...images, ...newUrls];
      setImages(updatedImages);
      onUpload(updatedImages);

      toast({
        title: 'Başarılı!',
        description: `${newUrls.length} resim yüklendi.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Hata!',
        description: 'Resim yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  }, [images, maxFiles, folder, onUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onUpload(updatedImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Resimler yükleniyor...</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Resim Yükle</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Resimleri buraya sürükleyin veya tıklayarak seçin
              </p>
              <div className="text-xs text-gray-500">
                <p>Desteklenen formatlar: JPEG, PNG, WebP, GIF</p>
                <p>Maksimum dosya boyutu: 5MB</p>
                <p>Maksimum {maxFiles} resim</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={uploading}
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={url}
                  alt={`Resim ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded truncate">
                  Resim {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{images.length} / {maxFiles} resim</span>
        {images.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImages([]);
              onUpload([]);
            }}
          >
            Tümünü Temizle
          </Button>
        )}
      </div>
    </div>
  );
} 