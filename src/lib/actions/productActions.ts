"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, where, serverTimestamp, limit, Timestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Product, ProductFeature, ProductSpecificationGroup, ProductImage, ProductDocument, AddProductFormData } from "@/types";
import { AddProductFormSchema } from "@/types";
import { generateSlug } from "@/lib/utils";
import { createCategoryIfNotExists } from "./categoryActions"; // Import schema from types

// URL validation helper
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

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

// Helper to safely parse JSON strings for complex fields
function safeJsonParse<T>(jsonString: string | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn("Failed to parse JSON string for complex field:", error);
    return defaultValue; // Return default or an empty array/object on error
  }
}

interface ProductActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function addProduct(formData: FormData): Promise<ProductActionResult> {
  try {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const imagesString = formData.get('images') as string;
    const images = JSON.parse(imagesString || '[]');
    const isActive = formData.get('isActive') === 'on';
    const sku = formData.get('sku') as string;
    const tags = formData.get('tags') as string;

    if (!name || !slug || !categoryId) {
      return { success: false, message: 'Gerekli alanlar eksik.' };
    }

    const existingProduct = await checkSlugExists(slug);
    if (existingProduct) {
      return { success: false, message: 'Bu slug zaten kullanımda.' };
    }

    const productData: Omit<Product, 'id'> = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      categoryId,
      images,
      isActive,
      isPremium: formData.get('isPremium') === 'on',
      sku: sku.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'products'), productData);
    
    // Activity log
    await logActivity(`Yeni ürün eklendi: "${name}"`, 'create');
    
    revalidatePath('/admin/products');
    
    return { 
      success: true, 
      message: 'Ürün başarıyla eklendi.',
      data: { id: docRef.id, ...productData }
    };
  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    return { success: false, message: 'Ürün eklenirken bir hata oluştu.' };
  }
}

export async function updateProduct(id: string, formData: FormData): Promise<ProductActionResult> {
  try {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const imagesString = formData.get('images') as string;
    const images = JSON.parse(imagesString || '[]');
    const isActive = formData.get('isActive') === 'on';
    const sku = formData.get('sku') as string;
    const tags = formData.get('tags') as string;

    if (!name || !slug || !categoryId) {
      return { success: false, message: 'Gerekli alanlar eksik.' };
    }

    const currentProduct = await getDoc(doc(db, 'products', id));
    if (!currentProduct.exists()) {
      return { success: false, message: 'Ürün bulunamadı.' };
    }

    const currentData = currentProduct.data() as Product;
    if (currentData.slug !== slug) {
      const existingProduct = await checkSlugExists(slug);
      if (existingProduct) {
        return { success: false, message: 'Bu slug zaten kullanımda.' };
      }
    }

    const updatedData: Partial<Product> = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      categoryId,
      images,
      isActive,
      isPremium: formData.get('isPremium') === 'on',
      sku: sku.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, 'products', id), updatedData);
    
    // Activity log
    await logActivity(`Ürün güncellendi: "${name}"`, 'update');
    
    revalidatePath('/admin/products');
    
    return { 
      success: true, 
      message: 'Ürün başarıyla güncellendi.',
      data: { id, ...updatedData }
    };
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    return { success: false, message: 'Ürün güncellenirken bir hata oluştu.' };
  }
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  try {
    // Get product name for logging
    const productDoc = await getDoc(doc(db, 'products', id));
    const productName = productDoc.exists() ? (productDoc.data() as Product).name : 'Unknown';
    
    await deleteDoc(doc(db, 'products', id));
    
    // Activity log
    await logActivity(`Ürün silindi: "${productName}"`, 'delete');
    
    revalidatePath('/admin/products');
    return { success: true, message: 'Ürün başarıyla silindi.' };
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    return { success: false, message: 'Ürün silinirken bir hata oluştu.' };
  }
}

export async function toggleProductStatus(id: string): Promise<ProductActionResult> {
  try {
    const productRef = doc(db, 'products', id);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return { success: false, message: 'Ürün bulunamadı.' };
    }
    
    const currentData = productDoc.data() as Product;
    const newStatus = !currentData.isActive;
    
    await updateDoc(productRef, { 
      isActive: newStatus,
      updatedAt: new Date()
    });
    
    // Activity log
    await logActivity(`Ürün durumu değiştirildi: "${currentData.name}" ${newStatus ? 'aktif' : 'pasif'} edildi`, 'update');
    
    revalidatePath('/admin/products');
    return { 
      success: true, 
      message: `Ürün ${newStatus ? 'aktif' : 'pasif'} edildi.` 
    };
  } catch (error) {
    console.error('Ürün durum değiştirme hatası:', error);
    return { success: false, message: 'Ürün durumu değiştirilirken bir hata oluştu.' };
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'products'), 
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
    }) as Product[];
  } catch (error) {
    console.error('Ürünler getirme hatası:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docSnapshot = await getDoc(doc(db, 'products', id));
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Product;
    }
    return null;
  } catch (error) {
    console.error('Ürün getirme hatası:', error);
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(collection(db, 'products'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Product;
    }
    
    return null;
  } catch (error) {
    console.error('Slug ile ürün getirme hatası:', error);
    return null;
  }
}

export async function checkSlugExists(slug: string): Promise<boolean> {
  try {
    const product = await getProductBySlug(slug);
    return product !== null;
  } catch (error) {
    console.error('Slug kontrol hatası:', error);
    return false;
  }
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'), 
      where('categoryId', '==', categoryId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      };
    }) as Product[];
  } catch (error) {
    console.error('Kategoriye göre ürün getirme hatası:', error);
    return [];
  }
}

export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    const allProducts = await getAllProducts();
    
    const filteredProducts = allProducts.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower))
      );
    });
    
    return filteredProducts;
  } catch (error) {
    console.error('Ürün arama hatası:', error);
    return [];
  }
}

export async function bulkUpdateProducts(productIds: string[], updateData: Partial<Product>): Promise<ProductActionResult> {
  try {
    const updatePromises = productIds.map(id => 
      updateDoc(doc(db, 'products', id), {
        ...updateData,
        updatedAt: new Date()
      })
    );
    
    await Promise.all(updatePromises);
    revalidatePath('/admin/products');
    
    return { 
      success: true, 
      message: `${productIds.length} ürün başarıyla güncellendi.` 
    };
  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    return { success: false, message: 'Ürünler güncellenirken bir hata oluştu.' };
  }
}

export async function bulkDeleteProducts(productIds: string[]): Promise<ProductActionResult> {
  try {
    const deletePromises = productIds.map(id => 
      deleteDoc(doc(db, 'products', id))
    );
    
    await Promise.all(deletePromises);
    revalidatePath('/admin/products');
    
    return { 
      success: true, 
      message: `${productIds.length} ürün başarıyla silindi.` 
    };
  } catch (error) {
    console.error('Toplu silme hatası:', error);
    return { success: false, message: 'Ürünler silinirken bir hata oluştu.' };
  }
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  try {
    const docData: Omit<Product, 'id'> = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'products'), docData);
    
    // Activity log
    await logActivity(`Yeni ürün oluşturuldu: "${productData.name}"`, 'create');
    
    revalidatePath('/admin/products');
    
    return { 
      id: docRef.id, 
      ...docData 
    };
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    throw new Error('Ürün oluşturulamadı');
  }
}

export async function getPremiumProducts(): Promise<Product[]> {
  try {
    // Önce tüm aktif ürünleri al, sonra premium olanları filtrele
    const q = query(
      collection(db, 'products'), 
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    const allActiveProducts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      };
    }) as Product[];
    
    // Premium ürünleri filtrele ve sırala
    return allActiveProducts
      .filter(product => product.isPremium === true)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 6);
      
  } catch (error) {
    console.error('Premium ürünler getirme hatası:', error);
    return [];
  }
}

export async function togglePremiumStatus(id: string): Promise<ProductActionResult> {
  try {
    const productRef = doc(db, 'products', id);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return { success: false, message: 'Ürün bulunamadı.' };
    }
    
    const currentData = productDoc.data() as Product;
    const newPremiumStatus = !currentData.isPremium;
    
    await updateDoc(productRef, { 
      isPremium: newPremiumStatus,
      updatedAt: new Date()
    });
    
    // Activity log
    await logActivity(`Ürün premium durumu değiştirildi: "${currentData.name}" ${newPremiumStatus ? 'premium' : 'normal'} yapıldı`, 'update');
    
    revalidatePath('/admin/products');
    revalidatePath('/');
    
    return { 
      success: true, 
      message: `Ürün ${newPremiumStatus ? 'premium' : 'normal'} yapıldı.` 
    };
  } catch (error) {
    console.error('Premium durum değiştirme hatası:', error);
    return { success: false, message: 'Premium durumu değiştirilirken bir hata oluştu.' };
  }
}

export async function bulkSetPremium(productIds: string[], isPremium: boolean): Promise<ProductActionResult> {
  try {
    const updatePromises = productIds.map(id => 
      updateDoc(doc(db, 'products', id), {
        isPremium,
        updatedAt: new Date()
      })
    );
    
    await Promise.all(updatePromises);
    
    // Activity log
    await logActivity(`${productIds.length} ürün toplu premium durumu: ${isPremium ? 'premium yapıldı' : 'normal yapıldı'}`, 'update');
    
    revalidatePath('/admin/products');
    revalidatePath('/');
    
    return { 
      success: true, 
      message: `${productIds.length} ürün ${isPremium ? 'premium' : 'normal'} yapıldı.` 
    };
  } catch (error) {
    console.error('Toplu premium değiştirme hatası:', error);
    return { success: false, message: 'Premium durumu değiştirilirken bir hata oluştu.' };
  }
}

export async function migrateProductsAddPremium(): Promise<ProductActionResult> {
  try {
    const allProducts = await getAllProducts();
    const updatePromises = allProducts.map(product => {
      if (product.isPremium === undefined) {
        return updateDoc(doc(db, 'products', product.id), {
          isPremium: false,
          updatedAt: new Date()
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(updatePromises);
    
    // Activity log
    await logActivity(`${allProducts.length} ürün premium field migration tamamlandı`, 'update');
    
    revalidatePath('/admin/products');
    
    return { 
      success: true, 
      message: `${allProducts.length} ürün için premium field eklendi.` 
    };
  } catch (error) {
    console.error('Migration hatası:', error);
    return { success: false, message: 'Migration işlemi başarısız.' };
  }
}

export async function getProductByName(name: string): Promise<Product | null> {
  try {
    const q = query(collection(db, 'products'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Product;
    }
    
    return null;
  } catch (error) {
    console.error('İsim ile ürün getirme hatası:', error);
    return null;
  }
}

export async function updateExistingProduct(id: string, updateData: Partial<Product>): Promise<Product> {
  try {
    const updatedData = {
      ...updateData,
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, 'products', id), updatedData);
    
    // Activity log
    await logActivity(`Ürün güncellendi: "${updateData.name || 'ID: ' + id}"`, 'update');
    
    revalidatePath('/admin/products');
    
    const updatedProduct = await getProductById(id);
    if (!updatedProduct) {
      throw new Error('Güncellenen ürün bulunamadı');
    }
    
    return updatedProduct;
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    throw new Error('Ürün güncellenemedi');
  }
}

export async function smartBulkImport(
  excelProducts: Array<{
    İsim: string;
    Açıklama: string;
    SKU?: string;
    Marka?: string;
    Kategoriler: string;
    'Resim URL': string;
  }>
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < excelProducts.length; i++) {
    const excelProduct = excelProducts[i];
    
    try {
      if (!excelProduct.İsim || !excelProduct.Açıklama) {
        throw new Error(`Satır ${i + 2}: İsim ve Açıklama zorunlu`);
      }

      const existingProduct = await getProductByName(excelProduct.İsim);
      
      const imageUrls = excelProduct['Resim URL']
        ? excelProduct['Resim URL']
            .split(/[,;]/) // Hem virgül hem noktalı virgül desteği
            .map(url => url.trim())
            .filter(url => url && isValidUrl(url))
        : [];

      const categoryId = await createCategoryIfNotExists(excelProduct.Kategoriler);

      if (existingProduct) {
        let needsUpdate = false;
        const updateData: Partial<Product> = {};
        const updateReasons: string[] = [];

        // Resim güncelleme - boş ise veya Excel'dekiler farklı ise
        if (!existingProduct.images || existingProduct.images.length === 0) {
          if (imageUrls.length > 0) {
            updateData.images = imageUrls;
            needsUpdate = true;
            updateReasons.push('resim eklendi');
          }
        } else if (imageUrls.length > 0) {
          // Mevcut resimlerle Excel'deki resimleri karşılaştır
          const existingImageSet = new Set(existingProduct.images);
          const excelImageSet = new Set(imageUrls);
          const hasNewImages = imageUrls.some(url => !existingImageSet.has(url));
          
          if (hasNewImages) {
            // Excel'deki ilk resmi kapak resmi olarak kullan, sonra mevcut resimleri ekle
            const mergedImages = Array.from(new Set([...imageUrls, ...existingProduct.images]));
            updateData.images = mergedImages;
            needsUpdate = true;
            updateReasons.push('yeni resimler eklendi (Excel ilk resim kapak)');
          }
        }

        // Açıklama güncelleme - boş ise veya farklı ise
        if (!existingProduct.description || existingProduct.description.trim() === '') {
          updateData.description = excelProduct.Açıklama;
          needsUpdate = true;
          updateReasons.push('açıklama eklendi');
        } else if (existingProduct.description !== excelProduct.Açıklama) {
          updateData.description = excelProduct.Açıklama;
          needsUpdate = true;
          updateReasons.push('açıklama güncellendi');
        }

        // SKU güncelleme
        if (!existingProduct.sku && excelProduct.SKU) {
          updateData.sku = excelProduct.SKU;
          needsUpdate = true;
          updateReasons.push('SKU eklendi');
        } else if (existingProduct.sku !== excelProduct.SKU && excelProduct.SKU) {
          updateData.sku = excelProduct.SKU;
          needsUpdate = true;
          updateReasons.push('SKU güncellendi');
        }

        // Tag güncelleme
        if (!existingProduct.tags || existingProduct.tags.length === 0) {
          if (excelProduct.Marka) {
            updateData.tags = [excelProduct.Marka];
            needsUpdate = true;
            updateReasons.push('marka etiketi eklendi');
          }
        } else if (excelProduct.Marka) {
          const existingTags = existingProduct.tags || [];
          if (!existingTags.includes(excelProduct.Marka)) {
            updateData.tags = [...existingTags, excelProduct.Marka];
            needsUpdate = true;
            updateReasons.push('yeni marka etiketi eklendi');
          }
        }

        // Kategori güncelleme
        if (!existingProduct.categoryId || existingProduct.categoryId === 'default') {
          if (categoryId && categoryId !== 'default') {
            updateData.categoryId = categoryId;
            needsUpdate = true;
            updateReasons.push('kategori eklendi');
          }
        } else if (existingProduct.categoryId !== categoryId && categoryId && categoryId !== 'default') {
          updateData.categoryId = categoryId;
          needsUpdate = true;
          updateReasons.push('kategori güncellendi');
        }

        if (needsUpdate) {
          await updateExistingProduct(existingProduct.id, updateData);
          updated++;
          console.log(`✅ Ürün güncellendi: ${excelProduct.İsim} (${updateReasons.join(', ')})`);
        } else {
          skipped++;
          console.log(`⏭️ Ürün atlandı: ${excelProduct.İsim} (değişiklik yok)`);
        }
      } else {
        const product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
          name: excelProduct.İsim,
          slug: generateSlug(excelProduct.İsim),
          description: excelProduct.Açıklama,
          categoryId: categoryId,
          images: imageUrls,
          isActive: true,
          sku: excelProduct.SKU || undefined,
          tags: excelProduct.Marka ? [excelProduct.Marka] : []
        };

        await createProduct(product);
        created++;
        console.log(`🆕 Yeni ürün eklendi: ${excelProduct.İsim}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      errors.push(`Satır ${i + 2}: ${excelProduct.İsim || 'Bilinmeyen ürün'} - ${errorMessage}`);
      console.error(`❌ Ürün hatası: ${excelProduct.İsim || 'Bilinmeyen'} - ${errorMessage}`);
    }
  }

  return { created, updated, skipped, errors };
}
