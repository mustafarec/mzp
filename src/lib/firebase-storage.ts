import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL, deleteObject, listAll, uploadBytesResumable } from 'firebase/storage';

// Progress callback tipi
export type UploadProgressCallback = (progress: number) => void;

// Base64 upload fonksiyonu (CORS sorununu aşar)
export async function uploadFileAsBase64(file: File, path: string, onProgress?: UploadProgressCallback): Promise<string> {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          onProgress?.(50); // %50 - Dosya okundu
          const base64String = reader.result as string;
          const storageRef = ref(storage, path);
          
          onProgress?.(75); // %75 - Upload başladı
          const snapshot = await uploadString(storageRef, base64String, 'data_url');
          onProgress?.(90); // %90 - Upload tamamlandı
          const downloadURL = await getDownloadURL(snapshot.ref);
          onProgress?.(100); // %100 - URL alındı
          resolve(downloadURL);
        } catch (error) {
          console.error('Base64 upload error:', error);
          reject(new Error('Dosya yüklenirken bir hata oluştu.'));
        }
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      onProgress?.(25); // %25 - Okuma başladı
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Dosya upload hatası:', error);
    throw new Error('Dosya yüklenirken bir hata oluştu.');
  }
}

// Ana upload fonksiyonu - önce base64 dener, başarısız olursa alternatif
export async function uploadFile(file: File, path: string, onProgress?: UploadProgressCallback): Promise<string> {
  try {
    // Önce base64 yöntemi dener
    return await uploadFileAsBase64(file, path, onProgress);
  } catch (error) {
    console.error('Upload failed, trying alternative method:', error);
    throw error;
  }
}

// Çoklu dosya upload
export async function uploadMultipleFiles(files: File[], basePath: string): Promise<string[]> {
  try {
    const uploadPromises = files.map((file, index) => {
      const fileName = `${Date.now()}_${index}_${file.name}`;
      const path = `${basePath}/${fileName}`;
      return uploadFile(file, path);
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Çoklu dosya upload hatası:', error);
    throw new Error('Dosyalar yüklenirken bir hata oluştu.');
  }
}

// Resim optimizasyonu ve upload
export async function uploadOptimizedImage(file: File, path: string, maxWidth = 1200, onProgress?: UploadProgressCallback): Promise<string> {
  try {
    onProgress?.(10); // %10 - Optimizasyon başladı
    const optimizedFile = await optimizeImage(file, maxWidth);
    onProgress?.(20); // %20 - Optimizasyon tamamlandı
    return await uploadFile(optimizedFile, path, (progress) => {
      // Upload progress'i 20-100 arasında map et
      const mappedProgress = 20 + (progress * 0.8);
      onProgress?.(Math.round(mappedProgress));
    });
  } catch (error) {
    console.error('Optimized image upload hatası:', error);
    throw new Error('Resim yüklenirken bir hata oluştu.');
  }
}

// Resim optimizasyonu
export function optimizeImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Boyut hesaplama
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;
      
      canvas.width = width;
      canvas.height = height;
      
      // Resmi çiz ve optimize et
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Resim optimizasyonu başarısız'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Resim yüklenemedi'));
    img.src = URL.createObjectURL(file);
  });
}

// Dosya silme
export async function deleteFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    throw new Error('Dosya silinirken bir hata oluştu.');
  }
}

// Klasördeki tüm dosyaları listeleme
export async function listFiles(path: string): Promise<string[]> {
  try {
    const folderRef = ref(storage, path);
    const result = await listAll(folderRef);
    
    const urlPromises = result.items.map(item => getDownloadURL(item));
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error('Dosya listeleme hatası:', error);
    return [];
  }
}

// Dosya tipi kontrolleri
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Sadece JPEG, PNG, WebP ve GIF formatları desteklenir.' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Dosya boyutu 5MB\'dan büyük olamaz.' };
  }
  
  return { isValid: true };
}

// Dosya boyutunu formatla
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 