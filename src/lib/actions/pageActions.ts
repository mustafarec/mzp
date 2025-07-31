"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, where, Timestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { Page } from "@/types";

async function logActivity(action: string, type: 'create' | 'update' | 'delete' = 'update', user: string = 'Admin') {
  try {
    await addDoc(collection(db, 'admin_activities'), {
      action,
      user,
      type,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Activity log hatası:', error);
  }
}

interface PageActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function addPage(formData: FormData): Promise<PageActionResult> {
  try {
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const template = formData.get('template') as Page['template'];
    const isActive = formData.get('isActive') === 'on';

    if (!title || !slug || !content) {
      return { success: false, message: 'Gerekli alanlar eksik.' };
    }

    const existingPage = await checkSlugExists(slug);
    if (existingPage) {
      return { success: false, message: 'Bu slug zaten kullanımda.' };
    }

    const pageData: Omit<Page, 'id'> = {
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      metaTitle: metaTitle?.trim() || title.trim(),
      metaDescription: metaDescription?.trim(),
      template: template || 'default',
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'pages'), pageData);
    
    await logActivity(`Yeni sayfa eklendi: "${title}"`, 'create');
    
    revalidatePath('/admin/pages');
    
    return { 
      success: true, 
      message: 'Sayfa başarıyla eklendi.',
      data: { id: docRef.id, ...pageData }
    };
  } catch (error) {
    console.error('Sayfa ekleme hatası:', error);
    return { success: false, message: 'Sayfa eklenirken bir hata oluştu.' };
  }
}

export async function updatePage(id: string, formData: FormData): Promise<PageActionResult> {
  try {
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const template = formData.get('template') as Page['template'];
    const isActive = formData.get('isActive') === 'on';

    if (!title || !slug || !content) {
      return { success: false, message: 'Gerekli alanlar eksik.' };
    }

    const currentPage = await getDoc(doc(db, 'pages', id));
    if (!currentPage.exists()) {
      return { success: false, message: 'Sayfa bulunamadı.' };
    }

    const currentData = currentPage.data() as Page;
    if (currentData.slug !== slug) {
      const existingPage = await checkSlugExists(slug);
      if (existingPage) {
        return { success: false, message: 'Bu slug zaten kullanımda.' };
      }
    }

    const updatedData: Partial<Page> = {
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      metaTitle: metaTitle?.trim() || title.trim(),
      metaDescription: metaDescription?.trim(),
      template: template || 'default',
      isActive,
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, 'pages', id), updatedData);
    
    await logActivity(`Sayfa güncellendi: "${title}"`, 'update');
    
    revalidatePath('/admin/pages');
    
    return { 
      success: true, 
      message: 'Sayfa başarıyla güncellendi.',
      data: { id, ...updatedData }
    };
  } catch (error) {
    console.error('Sayfa güncelleme hatası:', error);
    return { success: false, message: 'Sayfa güncellenirken bir hata oluştu.' };
  }
}

export async function deletePage(id: string): Promise<PageActionResult> {
  try {
    const pageDoc = await getDoc(doc(db, 'pages', id));
    const pageTitle = pageDoc.exists() ? (pageDoc.data() as Page).title : 'Unknown';
    
    await deleteDoc(doc(db, 'pages', id));
    
    await logActivity(`Sayfa silindi: "${pageTitle}"`, 'delete');
    
    revalidatePath('/admin/pages');
    return { success: true, message: 'Sayfa başarıyla silindi.' };
  } catch (error) {
    console.error('Sayfa silme hatası:', error);
    return { success: false, message: 'Sayfa silinirken bir hata oluştu.' };
  }
}

export async function togglePageStatus(id: string): Promise<PageActionResult> {
  try {
    const pageRef = doc(db, 'pages', id);
    const pageDoc = await getDoc(pageRef);
    
    if (!pageDoc.exists()) {
      return { success: false, message: 'Sayfa bulunamadı.' };
    }
    
    const currentData = pageDoc.data() as Page;
    const newStatus = !currentData.isActive;
    
    await updateDoc(pageRef, { 
      isActive: newStatus,
      updatedAt: new Date()
    });
    
    await logActivity(`Sayfa durumu değiştirildi: "${currentData.title}" ${newStatus ? 'aktif' : 'pasif'} edildi`, 'update');
    
    revalidatePath('/admin/pages');
    return { 
      success: true, 
      message: `Sayfa ${newStatus ? 'aktif' : 'pasif'} edildi.` 
    };
  } catch (error) {
    console.error('Sayfa durum değiştirme hatası:', error);
    return { success: false, message: 'Sayfa durumu değiştirilirken bir hata oluştu.' };
  }
}

export async function getAllPages(): Promise<Page[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'pages'), 
        orderBy('createdAt', 'desc')
      )
    );
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      };
    }) as Page[];
  } catch (error) {
    console.error('Sayfalar getirme hatası:', error);
    return [];
  }
}

export async function getPageById(id: string): Promise<Page | null> {
  try {
    const docSnapshot = await getDoc(doc(db, 'pages', id));
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Page;
    }
    return null;
  } catch (error) {
    console.error('Sayfa getirme hatası:', error);
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const q = query(collection(db, 'pages'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Page;
    }
    
    return null;
  } catch (error) {
    console.error('Slug ile sayfa getirme hatası:', error);
    return null;
  }
}

export async function checkSlugExists(slug: string): Promise<boolean> {
  try {
    const page = await getPageBySlug(slug);
    return page !== null;
  } catch (error) {
    console.error('Slug kontrol hatası:', error);
    return false;
  }
} 