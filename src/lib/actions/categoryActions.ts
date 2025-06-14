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

// Ana kategori mapping sistemi - benzeri kategorileri ana kategorilere yönlendirir
const CATEGORY_MAPPINGS: { [key: string]: string[] } = {
  'Çim Tohumu': [
    'çim', 'tohum', 'grass', 'seed', 'çim tohumu', 'çim tohumları', 
    'turf', 'lawn', 'karışım', 'mix', 'çim karışım'
  ],
  'Gübre': [
    'gübre', 'fertilizer', 'besın', 'besin', 'nutrient', 'organic',
    'organik', 'kimyasal', 'chemical', 'npk', 'azot', 'fosfor'
  ],
  'Bahçe Makineleri': [
    'makine', 'machine', 'tool', 'alet', 'aletler', 'makineler',
    'çim biçme', 'mower', 'trimmer', 'testere', 'motor'
  ],
  'Bitki İlaçları': [
    'ilaç', 'pesticide', 'chemical', 'herbisit', 'fungisit',
    'insektisit', 'böcek', 'hastalık', 'yabani ot'
  ],
  'Peyzaj Malzemeleri': [
    'peyzaj', 'landscape', 'decoration', 'dekorasyon', 'süs',
    'bahçe düzenlemesi', 'çakıl', 'taş', 'bordür'
  ],
  'Sulama': [
    'sulama', 'irrigation', 'sprinkler', 'hortum', 'su',
    'damla sulama', 'yağmurlama'
  ],
  'Sera Ürünleri': [
    'sera', 'greenhouse', 'örtü altı', 'plastik', 'naylon'
  ]
};

// Kategori adını normalize et (küçük harf, türkçe karakter düzeltme)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

// Kategori adını ana kategorilerle eşleştir
function mapToMainCategory(categoryName: string): string {
  const normalized = normalizeText(categoryName);
  
  for (const [mainCategory, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
    // Tam eşleşme kontrolü
    if (keywords.some(keyword => normalizeText(keyword) === normalized)) {
      console.log(`📂 Kategori eşleşti: "${categoryName}" → "${mainCategory}"`);
      return mainCategory;
    }
    
    // Kısmi eşleşme kontrolü (kategori adı keyword içeriyorsa)
    if (keywords.some(keyword => normalized.includes(normalizeText(keyword)) || normalizeText(keyword).includes(normalized))) {
      console.log(`📂 Kategori kısmi eşleşti: "${categoryName}" → "${mainCategory}"`);
      return mainCategory;
    }
  }
  
  // Eşleşme bulunamadı, orijinal kategori adını döndür
  console.log(`📂 Yeni kategori: "${categoryName}"`);
  return categoryName;
}

export async function createCategoryIfNotExists(categoryName: string): Promise<string> {
  try {
    if (!categoryName || categoryName.trim() === '' || categoryName === 'default') {
      return 'default';
    }

    // Kategori adını ana kategorilerle eşleştir
    const mappedCategoryName = mapToMainCategory(categoryName.trim());
    
    // Eşleşen ana kategoriyi ara
    const existingCategory = await getCategoryByName(mappedCategoryName);
    
    if (existingCategory) {
      if (mappedCategoryName !== categoryName.trim()) {
        console.log(`✅ Kategori mevcut ana kategoriye yönlendirildi: "${categoryName}" → "${mappedCategoryName}"`);
      }
      return existingCategory.id;
    }

    // Kategori mevcut değil, yeni oluştur
    const categoryData = {
      name: mappedCategoryName,
      slug: generateSlug(mappedCategoryName),
      description: `${mappedCategoryName} kategorisi`,
      parentId: null,
      icon: '',
      isActive: true,
      sortOrder: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    
    await logActivity(`Otomatik kategori oluşturuldu: "${mappedCategoryName}"`, 'create');
    console.log(`🆕 Yeni kategori oluşturuldu: "${mappedCategoryName}"`);
    
    return docRef.id;
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    return 'default';
  }
}

// Benzer kategorileri birleştirme fonksiyonu
export async function consolidateCategories(): Promise<{
  merged: number;
  deleted: number;
  errors: string[];
}> {
  try {
    const allCategories = await getAllCategories();
    let merged = 0;
    let deleted = 0;
    const errors: string[] = [];
    
    console.log(`🔄 Kategori konsolidasyonu başlıyor... Toplam kategori: ${allCategories.length}`);
    
    for (const category of allCategories) {
      try {
        // Ana kategorilerle eşleştir
        const mappedName = mapToMainCategory(category.name);
        
        // Eğer kategori adı değişiyorsa (ana kategoriye eşleniyorsa)
        if (mappedName !== category.name) {
          // Ana kategoriyi bul veya oluştur
          let mainCategory = await getCategoryByName(mappedName);
          
          if (!mainCategory) {
            // Ana kategoriyi oluştur
            const categoryData = {
              name: mappedName,
              slug: generateSlug(mappedName),
              description: `${mappedName} kategorisi`,
              parentId: null,
              icon: '',
              isActive: true,
              sortOrder: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            const docRef = await addDoc(collection(db, 'categories'), categoryData);
            mainCategory = { id: docRef.id, ...categoryData } as Category;
            console.log(`🆕 Ana kategori oluşturuldu: "${mappedName}"`);
          }
          
          // Bu kategorideki tüm ürünleri ana kategoriye taşı
          const productsQuery = query(
            collection(db, 'products'),
            where('categoryId', '==', category.id)
          );
          const productsSnapshot = await getDocs(productsQuery);
          
          // Ürünleri yeni kategoriye taşı
          for (const productDoc of productsSnapshot.docs) {
            await updateDoc(doc(db, 'products', productDoc.id), {
              categoryId: mainCategory.id,
              updatedAt: serverTimestamp()
            });
          }
          
          // Eski kategoriyi sil
          await deleteDoc(doc(db, 'categories', category.id));
          
          merged++;
          console.log(`✅ Kategori birleştirildi: "${category.name}" → "${mappedName}" (${productsSnapshot.size} ürün taşındı)`);
        }
      } catch (error) {
        const errorMsg = `Kategori "${category.name}" birleştirilemedi: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    // Boş kategorileri temizle
    const updatedCategories = await getAllCategories();
    for (const category of updatedCategories) {
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('categoryId', '==', category.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        
        if (productsSnapshot.empty) {
          await deleteDoc(doc(db, 'categories', category.id));
          deleted++;
          console.log(`🗑️ Boş kategori silindi: "${category.name}"`);
        }
      } catch (error) {
        const errorMsg = `Boş kategori "${category.name}" silinemedi: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    await logActivity(`Kategori konsolidasyonu tamamlandı: ${merged} birleştirildi, ${deleted} silindi`, 'update');
    
    console.log(`✅ Kategori konsolidasyonu tamamlandı: ${merged} birleştirildi, ${deleted} boş kategori silindi`);
    
    return { merged, deleted, errors };
  } catch (error) {
    console.error('Kategori konsolidasyonu hatası:', error);
    return { merged: 0, deleted: 0, errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'] };
  }
} 