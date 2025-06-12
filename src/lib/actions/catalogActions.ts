import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Catalog, AddCatalogFormData } from '@/types';

const COLLECTION_NAME = 'catalogs';

// Helper function to create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Get all active catalogs
export async function getCatalogs(): Promise<Catalog[]> {
  try {
    const catalogsRef = collection(db, COLLECTION_NAME);
    // Simplified query without where clause to avoid composite index requirement
    const q = query(catalogsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const catalogs: Catalog[] = [];
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active catalogs
        if (data.isActive === true) {
          catalogs.push({
            id: doc.id,
            title: data.title || '',
            brand: data.brand || '',
            description: data.description || '',
            slug: data.slug || '',
            pdfUrl: data.pdfUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            fileSize: data.fileSize || 0,
            pageCount: data.pageCount || 0,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder || 0,
            category: data.category || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }
      });
    }
    
    // Sort by sortOrder and then by createdAt on client side
    catalogs.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return catalogs;
  } catch (error) {
    console.error('Error getting catalogs:', error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Get all catalogs for admin (including inactive)
export async function getAllCatalogs(): Promise<Catalog[]> {
  try {
    const catalogsRef = collection(db, COLLECTION_NAME);
    // Simplified query - using only one orderBy to avoid composite index requirement
    const q = query(catalogsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const catalogs: Catalog[] = [];
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        catalogs.push({
          id: doc.id,
          title: data.title || '',
          brand: data.brand || '',
          description: data.description || '',
          slug: data.slug || '',
          pdfUrl: data.pdfUrl || '',
          thumbnailUrl: data.thumbnailUrl || '',
          fileSize: data.fileSize || 0,
          pageCount: data.pageCount || 0,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder || 0,
          category: data.category || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
    }
    
    // Sort by sortOrder and then by createdAt on client side
    catalogs.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return catalogs;
  } catch (error) {
    console.error('Error getting all catalogs:', error);
    // Return empty array instead of throwing error to prevent crashes
    return [];
  }
}

// Get catalog by ID
export async function getCatalogById(id: string): Promise<Catalog | null> {
  try {
    const catalogRef = doc(db, COLLECTION_NAME, id);
    const catalogSnap = await getDoc(catalogRef);
    
    if (!catalogSnap.exists()) {
      return null;
    }
    
    const data = catalogSnap.data();
    return {
      id: catalogSnap.id,
      title: data.title,
      brand: data.brand,
      description: data.description || '',
      slug: data.slug,
      pdfUrl: data.pdfUrl,
      thumbnailUrl: data.thumbnailUrl,
      fileSize: data.fileSize,
      pageCount: data.pageCount,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      category: data.category,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting catalog by ID:', error);
    throw new Error('Katalog bulunamadı');
  }
}

// Get catalog by slug
export async function getCatalogBySlug(slug: string): Promise<Catalog | null> {
  try {
    const catalogsRef = collection(db, COLLECTION_NAME);
    const q = query(catalogsRef, where('slug', '==', slug), where('isActive', '==', true));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      title: data.title,
      brand: data.brand,
      description: data.description || '',
      slug: data.slug,
      pdfUrl: data.pdfUrl,
      thumbnailUrl: data.thumbnailUrl,
      fileSize: data.fileSize,
      pageCount: data.pageCount,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      category: data.category,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting catalog by slug:', error);
    throw new Error('Katalog bulunamadı');
  }
}

// Upload PDF file to Firebase Storage with progress tracking
export async function uploadCatalogPDF(
  file: File, 
  catalogTitle: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; pageCount: number }> {
  try {
    const sanitizedTitle = createSlug(catalogTitle);
    const fileName = `${sanitizedTitle}-${Date.now()}.pdf`;
    const storageRef = ref(storage, `catalogs/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      // Set upload timeout (10 minutes for large files)
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('PDF yükleme süresi aşıldı. Lütfen daha küçük bir dosya deneyin.'));
      }, 10 * 60 * 1000);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          clearTimeout(timeout);
          console.error('Upload error:', error);
          
          // Detailed error messages
          if (error.code === 'storage/unauthorized') {
            reject(new Error('PDF yükleme yetkisi yok. Lütfen yönetici ile iletişime geçin.'));
          } else if (error.code === 'storage/canceled') {
            reject(new Error('PDF yükleme iptal edildi.'));
          } else if (error.code === 'storage/quota-exceeded') {
            reject(new Error('Depolama alanı dolu. Lütfen yönetici ile iletişime geçin.'));
          } else {
            reject(new Error('PDF yüklenirken hata oluştu. Lütfen tekrar deneyin.'));
          }
        },
        async () => {
          clearTimeout(timeout);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Extract PDF metadata (page count)
            const pageCount = await extractPDFPageCount(file);
            
            resolve({ url: downloadURL, pageCount });
          } catch (error) {
            reject(new Error('PDF URL alınamadı'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw new Error('PDF yüklenemedi');
  }
}

// Extract PDF page count using PDF.js
async function extractPDFPageCount(file: File): Promise<number> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source consistently
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;
    
    return pdf.numPages;
  } catch (error) {
    console.warn('PDF page count extraction failed:', error);
    return 0; // Return 0 if extraction fails
  }
}

// Upload thumbnail image to Firebase Storage with progress tracking
export async function uploadCatalogThumbnail(
  file: File, 
  catalogTitle: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const sanitizedTitle = createSlug(catalogTitle);
    const fileName = `${sanitizedTitle}-thumb-${Date.now()}.jpg`;
    const storageRef = ref(storage, `catalogs/thumbnails/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      // Set upload timeout (5 minutes for thumbnails)
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Thumbnail yükleme süresi aşıldı. Lütfen tekrar deneyin.'));
      }, 5 * 60 * 1000);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          clearTimeout(timeout);
          console.error('Thumbnail upload error:', error);
          
          // Detailed error messages
          if (error.code === 'storage/unauthorized') {
            reject(new Error('Thumbnail yükleme yetkisi yok.'));
          } else if (error.code === 'storage/canceled') {
            reject(new Error('Thumbnail yükleme iptal edildi.'));
          } else {
            reject(new Error('Thumbnail yüklenirken hata oluştu. Lütfen tekrar deneyin.'));
          }
        },
        async () => {
          clearTimeout(timeout);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(new Error('Thumbnail URL alınamadı'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw new Error('Thumbnail yüklenemedi');
  }
}

// Add new catalog
export async function addCatalog(
  formData: AddCatalogFormData, 
  pdfUrl: string, 
  fileSize: number,
  thumbnailUrl?: string,
  pageCount?: number
): Promise<string> {
  try {
    // Generate slug if not provided
    const slug = formData.slug || createSlug(formData.title);
    
    // Check if slug already exists
    const existingCatalog = await getCatalogBySlug(slug);
    if (existingCatalog) {
      throw new Error('Bu slug zaten kullanımda. Lütfen farklı bir başlık kullanın.');
    }
    
    const catalogData = {
      title: formData.title,
      brand: formData.brand,
      description: formData.description || '',
      slug: slug,
      pdfUrl: pdfUrl,
      thumbnailUrl: thumbnailUrl || '',
      fileSize: fileSize,
      pageCount: pageCount || 0,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      category: formData.category || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const catalogsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(catalogsRef, catalogData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding catalog:', error);
    throw new Error(error instanceof Error ? error.message : 'Katalog eklenemedi');
  }
}

// Update catalog
export async function updateCatalog(
  id: string, 
  formData: AddCatalogFormData,
  pdfUrl?: string,
  fileSize?: number,
  thumbnailUrl?: string,
  pageCount?: number
): Promise<void> {
  try {
    const catalogRef = doc(db, COLLECTION_NAME, id);
    
    // Generate slug if not provided
    const slug = formData.slug || createSlug(formData.title);
    
    // Check if slug already exists (exclude current catalog)
    const existingCatalog = await getCatalogBySlug(slug);
    if (existingCatalog && existingCatalog.id !== id) {
      throw new Error('Bu slug zaten kullanımda. Lütfen farklı bir başlık kullanın.');
    }
    
    const updateData: any = {
      title: formData.title,
      brand: formData.brand,
      description: formData.description || '',
      slug: slug,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      category: formData.category || '',
      updatedAt: serverTimestamp()
    };
    
    // Only update PDF-related fields if new files are provided
    if (pdfUrl) {
      updateData.pdfUrl = pdfUrl;
    }
    if (fileSize !== undefined) {
      updateData.fileSize = fileSize;
    }
    if (thumbnailUrl) {
      updateData.thumbnailUrl = thumbnailUrl;
    }
    if (pageCount !== undefined) {
      updateData.pageCount = pageCount;
    }
    
    await updateDoc(catalogRef, updateData);
  } catch (error) {
    console.error('Error updating catalog:', error);
    throw new Error(error instanceof Error ? error.message : 'Katalog güncellenemedi');
  }
}

// Delete catalog
export async function deleteCatalog(id: string): Promise<void> {
  try {
    // Get catalog data first to delete associated files
    const catalog = await getCatalogById(id);
    if (!catalog) {
      throw new Error('Katalog bulunamadı');
    }
    
    // Delete PDF file from storage
    if (catalog.pdfUrl) {
      try {
        const pdfRef = ref(storage, catalog.pdfUrl);
        await deleteObject(pdfRef);
      } catch (error) {
        console.warn('PDF file could not be deleted from storage:', error);
      }
    }
    
    // Delete thumbnail file from storage
    if (catalog.thumbnailUrl) {
      try {
        const thumbnailRef = ref(storage, catalog.thumbnailUrl);
        await deleteObject(thumbnailRef);
      } catch (error) {
        console.warn('Thumbnail file could not be deleted from storage:', error);
      }
    }
    
    // Delete catalog document
    const catalogRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(catalogRef);
  } catch (error) {
    console.error('Error deleting catalog:', error);
    throw new Error(error instanceof Error ? error.message : 'Katalog silinemedi');
  }
}

// Get catalogs by brand
export async function getCatalogsByBrand(brand: string): Promise<Catalog[]> {
  try {
    const catalogsRef = collection(db, COLLECTION_NAME);
    // Simplified query to avoid composite index requirement
    const q = query(catalogsRef, where('brand', '==', brand));
    
    const querySnapshot = await getDocs(q);
    const catalogs: Catalog[] = [];
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active catalogs
        if (data.isActive === true) {
          catalogs.push({
            id: doc.id,
            title: data.title || '',
            brand: data.brand || '',
            description: data.description || '',
            slug: data.slug || '',
            pdfUrl: data.pdfUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            fileSize: data.fileSize || 0,
            pageCount: data.pageCount || 0,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder || 0,
            category: data.category || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }
      });
    }
    
    // Sort by sortOrder on client side
    catalogs.sort((a, b) => a.sortOrder - b.sortOrder);
    
    return catalogs;
  } catch (error) {
    console.error('Error getting catalogs by brand:', error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Get featured catalogs for homepage
export async function getFeaturedCatalogs(limitCount: number = 6): Promise<Catalog[]> {
  try {
    const catalogsRef = collection(db, COLLECTION_NAME);
    // Simplified query without where clause to avoid composite index requirement
    const q = query(catalogsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const catalogs: Catalog[] = [];
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active catalogs
        if (data.isActive === true && catalogs.length < limitCount) {
          catalogs.push({
            id: doc.id,
            title: data.title || '',
            brand: data.brand || '',
            description: data.description || '',
            slug: data.slug || '',
            pdfUrl: data.pdfUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            fileSize: data.fileSize || 0,
            pageCount: data.pageCount || 0,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder || 0,
            category: data.category || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }
      });
    }
    
    // Sort by sortOrder on client side
    catalogs.sort((a, b) => a.sortOrder - b.sortOrder);
    
    return catalogs;
  } catch (error) {
    console.error('Error getting featured catalogs:', error);
    // Return empty array instead of throwing error
    return [];
  }
}