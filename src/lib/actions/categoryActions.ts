import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  limit,
  Timestamp
} from 'firebase/firestore';
import type { Category } from '@/types';
import { generateSlug } from '@/lib/utils';

// Activity logger helper
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

// Kategori ekleme
export async function addCategory(formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      parentId: formData.get('parentId') as string || null,
      icon: formData.get('icon') as string,
      isActive: formData.get('isActive') === 'on',
      sortOrder: parseInt(formData.get('sortOrder') as string || '0'),
    };

    // Slug uniqueness kontrolü
    const slugQuery = query(collection(db, 'categories'), where('slug', '==', data.slug));
    const slugSnapshot = await getDocs(slugQuery);
    
    if (!slugSnapshot.empty) {
      return {
        message: 'Bu slug zaten kullanımda. Lütfen farklı bir slug seçin.',
        success: false,
        errors: { slug: ['Bu slug zaten mevcut'] }
      };
    }

    const categoryData = {
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      parentId: data.parentId || null,
      icon: data.icon || '',
      isActive: data.isActive || true,
      sortOrder: data.sortOrder || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    
    // Activity log
    await logActivity(`Yeni kategori eklendi: "${data.name}"`, 'create');
    
    console.log('Kategori eklendi:', docRef.id);
    return {
      message: 'Kategori başarıyla eklendi.',
      success: true
    };
    
  } catch (error: any) {
    console.error('Kategori ekleme hatası:', error);
    return {
      message: error.message || 'Kategori eklenirken bir hata oluştu.',
      success: false
    };
  }
}

// Tüm kategorileri getir
export async function getAllCategories(): Promise<Category[]> {
  try {
    const categoriesQuery = query(
      collection(db, 'categories'), 
      orderBy('sortOrder', 'asc')
    );
    const querySnapshot = await getDocs(categoriesQuery);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
    
    // Client tarafında name'e göre ikincil sıralama yap
    return categories.sort((a, b) => {
      if (a.sortOrder === b.sortOrder) {
        return a.name.localeCompare(b.name);
      }
      return a.sortOrder - b.sortOrder;
    });
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    return [];
  }
}

// Hierarşik kategori yapısı oluştur
export function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map();
  const roots: Category[] = [];

  // Önce tüm kategorileri map'e ekle
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Şimdi parent-child ilişkilerini kur
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id);
    
    if (category.parentId && categoryMap.has(category.parentId)) {
      const parent = categoryMap.get(category.parentId);
      parent.children.push(categoryWithChildren);
    } else {
      // Parent yok veya bulunamadı, root kategori
      roots.push(categoryWithChildren);
    }
  });

  return roots;
}

// Tek kategori getir
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, 'categories', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Category;
    }
    
    return null;
  } catch (error) {
    console.error('Kategori getirilirken hata:', error);
    return null;
  }
}

// Kategori güncelle
export async function updateCategory(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      parentId: formData.get('parentId') as string || null,
      icon: formData.get('icon') as string,
      isActive: formData.get('isActive') === 'on',
      sortOrder: parseInt(formData.get('sortOrder') as string || '0'),
    };

    // Kendini parent olarak seçemez
    if (data.parentId === id) {
      return {
        message: 'Kategori kendisini parent olarak seçemez.',
        success: false,
        errors: { parentId: ['Geçersiz parent seçimi'] }
      };
    }

    // Slug uniqueness kontrolü (başka kategorilerde)
    const slugQuery = query(
      collection(db, 'categories'), 
      where('slug', '==', data.slug)
    );
    const slugSnapshot = await getDocs(slugQuery);
    
    const hasConflict = slugSnapshot.docs.some(doc => doc.id !== id);
    if (hasConflict) {
      return {
        message: 'Bu slug zaten kullanımda. Lütfen farklı bir slug seçin.',
        success: false,
        errors: { slug: ['Bu slug zaten mevcut'] }
      };
    }

    const updateData = {
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      parentId: data.parentId || null,
      icon: data.icon || '',
      isActive: data.isActive || true,
      sortOrder: data.sortOrder || 0,
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, updateData);
    
    // Activity log
    await logActivity(`Kategori güncellendi: "${data.name}"`, 'update');
    
    console.log('Kategori güncellendi:', id);
    return {
      message: 'Kategori başarıyla güncellendi.',
      success: true
    };
    
  } catch (error: any) {
    console.error('Kategori güncelleme hatası:', error);
    return {
      message: error.message || 'Kategori güncellenirken bir hata oluştu.',
      success: false
    };
  }
}

// Kategori sil
export async function deleteCategory(id: string) {
  try {
    // Get category name for logging
    const categoryDoc = await getDoc(doc(db, 'categories', id));
    const categoryName = categoryDoc.exists() ? (categoryDoc.data() as Category).name : 'Unknown';
    
    // Alt kategorileri kontrol et
    const childQuery = query(
      collection(db, 'categories'), 
      where('parentId', '==', id)
    );
    const childSnapshot = await getDocs(childQuery);
    
    if (!childSnapshot.empty) {
      return {
        message: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.',
        success: false
      };
    }

    // Bu kategoriye ait ürünleri kontrol et
    const productQuery = query(
      collection(db, 'products'), 
      where('categoryId', '==', id)
    );
    const productSnapshot = await getDocs(productQuery);
    
    if (!productSnapshot.empty) {
      return {
        message: 'Bu kategoriye ait ürünler var. Önce ürünleri başka kategoriye taşıyın.',
        success: false
      };
    }

    await deleteDoc(doc(db, 'categories', id));
    
    // Activity log
    await logActivity(`Kategori silindi: "${categoryName}"`, 'delete');
    
    console.log('Kategori silindi:', id);
    return {
      message: 'Kategori başarıyla silindi.',
      success: true
    };
    
  } catch (error: any) {
    console.error('Kategori silme hatası:', error);
    return {
      message: error.message || 'Kategori silinirken bir hata oluştu.',
      success: false
    };
  }
}

// Kategori durumunu değiştir
export async function toggleCategoryStatus(id: string, isActive: boolean) {
  try {
    // Get category name for logging
    const categoryDoc = await getDoc(doc(db, 'categories', id));
    const categoryName = categoryDoc.exists() ? (categoryDoc.data() as Category).name : 'Unknown';
    
    await updateDoc(doc(db, 'categories', id), {
      isActive,
      updatedAt: serverTimestamp()
    });
    
    // Activity log
    await logActivity(`Kategori durumu değiştirildi: "${categoryName}" ${isActive ? 'aktif' : 'pasif'} edildi`, 'update');
    
    return {
      message: `Kategori ${isActive ? 'aktif' : 'pasif'} edildi.`,
      success: true
    };
  } catch (error: any) {
    console.error('Kategori durum değiştirme hatası:', error);
    return {
      message: error.message || 'Kategori durumu değiştirilirken bir hata oluştu.',
      success: false
    };
  }
}

// Parent kategoriler getir (dropdown için)
export async function getParentCategories(): Promise<Category[]> {
  try {
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(categoriesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  } catch (error) {
    console.error('Parent kategoriler getirilirken hata:', error);
    return [];
  }
}

export async function getCategoryByName(name: string): Promise<Category | null> {
  try {
    const q = query(collection(db, 'categories'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Category;
    }
    
    return null;
  } catch (error) {
    console.error('İsim ile kategori getirme hatası:', error);
    return null;
  }
}

export async function createCategoryIfNotExists(categoryName: string): Promise<string> {
  try {
    if (!categoryName || categoryName.trim() === '' || categoryName === 'default') {
      return 'default';
    }

    const existingCategory = await getCategoryByName(categoryName);
    
    if (existingCategory) {
      return existingCategory.id;
    }

    const categoryData = {
      name: categoryName.trim(),
      slug: generateSlug(categoryName),
      description: `${categoryName} kategorisi`,
      parentId: null,
      icon: '',
      isActive: true,
      sortOrder: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    
    await logActivity(`Otomatik kategori oluşturuldu: "${categoryName}"`, 'create');
    
    return docRef.id;
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    return 'default';
  }
} 