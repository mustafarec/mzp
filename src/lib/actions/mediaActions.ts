'use server';

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where, 
  limit as firestoreLimit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Media } from '@/types';

export async function uploadMedia(file: File, alt?: string, description?: string) {
  try {
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `media/${filename}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    const mediaType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'document';
    
    const mediaData: Omit<Media, 'id'> = {
      filename,
      originalName: file.name,
      url,
      type: mediaType,
      mimeType: file.type,
      size: file.size,
      alt: alt || '',
      description: description || '',
      uploadedBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'media'), mediaData);
    
    return {
      success: true,
      media: { ...mediaData, id: docRef.id },
      message: 'Medya başarıyla yüklendi'
    };
  } catch (error) {
    console.error('Medya yükleme hatası:', error);
    return {
      success: false,
      message: 'Medya yüklenirken hata oluştu'
    };
  }
}

export async function getMediaList(page = 1, limit = 20, type?: Media['type']) {
  try {
    let q = query(
      collection(db, 'media'),
      orderBy('createdAt', 'desc')
    );
    
    if (type) {
      q = query(q, where('type', '==', type));
    }
    
    if (limit) {
      q = query(q, firestoreLimit(limit));
    }

    const snapshot = await getDocs(q);
    const media: Media[] = [];
    
    snapshot.forEach((doc) => {
      media.push({ id: doc.id, ...doc.data() } as Media);
    });

    return {
      success: true,
      media,
      total: media.length
    };
  } catch (error) {
    console.error('Medya listesi getirme hatası:', error);
    return {
      success: false,
      media: [],
      total: 0
    };
  }
}

export async function updateMedia(id: string, data: Partial<Media>) {
  try {
    const docRef = doc(db, 'media', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: 'Medya başarıyla güncellendi'
    };
  } catch (error) {
    console.error('Medya güncelleme hatası:', error);
    return {
      success: false,
      message: 'Medya güncellenirken hata oluştu'
    };
  }
}

export async function deleteMedia(id: string) {
  try {
    const docRef = doc(db, 'media', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const media = docSnap.data() as Media;
      
      try {
        const storageRef = ref(storage, `media/${media.filename}`);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('Storage silme hatası:', storageError);
      }
      
      await deleteDoc(docRef);
      
      return {
        success: true,
        message: 'Medya başarıyla silindi'
      };
    } else {
      return {
        success: false,
        message: 'Medya bulunamadı'
      };
    }
  } catch (error) {
    console.error('Medya silme hatası:', error);
    return {
      success: false,
      message: 'Medya silinirken hata oluştu'
    };
  }
} 