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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SliderWidget, SliderImage, SliderSettings } from '@/types';
import { DEFAULT_SLIDER_SETTINGS } from '@/lib/constants/slider';

// Activity logger helper
async function logActivity(action: string, type: 'create' | 'update' | 'delete' = 'update', user: string = 'Admin') {
  try {
    await addDoc(collection(db, 'admin_activities'), {
      action,
      user,
      type,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Activity log hatası:', error);
  }
}


export async function createSlider(sliderData: {
  title: string;
  position: SliderWidget['position'];
  displayName?: string;
  settings?: Partial<SliderSettings>;
  isActive?: boolean;
  order?: number;
}) {
  try {
    const settings = { ...DEFAULT_SLIDER_SETTINGS, ...sliderData.settings };
    
    const slider: Omit<SliderWidget, 'id'> = {
      type: 'slider',
      title: sliderData.title,
      position: sliderData.position,
      ...(sliderData.displayName && { displayName: sliderData.displayName }),
      images: [],
      settings,
      order: sliderData.order || 0,
      isActive: sliderData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'sliders'), slider);
    
    await logActivity(`Yeni slider oluşturuldu: "${sliderData.title}"`, 'create');
    
    return {
      success: true,
      slider: { ...slider, id: docRef.id },
      message: 'Slider başarıyla oluşturuldu'
    };
  } catch (error) {
    console.error('Slider oluşturma hatası:', error);
    return {
      success: false,
      message: 'Slider oluşturulurken hata oluştu'
    };
  }
}

export async function getSliders() {
  try {
    const q = query(
      collection(db, 'sliders'),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);
    const sliders: SliderWidget[] = [];
    
    snapshot.forEach((doc) => {
      sliders.push({ id: doc.id, ...doc.data() } as SliderWidget);
    });

    return {
      success: true,
      sliders
    };
  } catch (error) {
    console.error('Slider listesi getirme hatası:', error);
    return {
      success: false,
      sliders: []
    };
  }
}

export async function getSlidersByPosition(position: SliderWidget['position']) {
  try {
    const q = query(
      collection(db, 'sliders'),
      where('position', '==', position),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);
    const sliders: SliderWidget[] = [];
    
    snapshot.forEach((doc) => {
      sliders.push({ id: doc.id, ...doc.data() } as SliderWidget);
    });

    return {
      success: true,
      sliders
    };
  } catch (error) {
    console.error('Position slider getirme hatası:', error);
    return {
      success: false,
      sliders: []
    };
  }
}

export async function getSliderById(id: string) {
  try {
    const docRef = doc(db, 'sliders', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        slider: { id: docSnap.id, ...docSnap.data() } as SliderWidget
      };
    } else {
      return {
        success: false,
        message: 'Slider bulunamadı'
      };
    }
  } catch (error) {
    console.error('Slider getirme hatası:', error);
    return {
      success: false,
      message: 'Slider getirilirken hata oluştu'
    };
  }
}

export async function updateSlider(id: string, data: Partial<SliderWidget>) {
  try {
    const docRef = doc(db, 'sliders', id);
    
    // Remove undefined values from data
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: new Date().toISOString()
    });
    
    await logActivity(`Slider güncellendi: "${data.title || id}"`, 'update');
    
    return {
      success: true,
      message: 'Slider başarıyla güncellendi'
    };
  } catch (error) {
    console.error('Slider güncelleme hatası:', error);
    return {
      success: false,
      message: 'Slider güncellenirken hata oluştu'
    };
  }
}

export async function deleteSlider(id: string) {
  try {
    const sliderDoc = await getDoc(doc(db, 'sliders', id));
    const sliderTitle = sliderDoc.exists() ? (sliderDoc.data() as SliderWidget).title : 'Unknown';
    
    const docRef = doc(db, 'sliders', id);
    await deleteDoc(docRef);
    
    await logActivity(`Slider silindi: "${sliderTitle}"`, 'delete');
    
    return {
      success: true,
      message: 'Slider başarıyla silindi'
    };
  } catch (error) {
    console.error('Slider silme hatası:', error);
    return {
      success: false,
      message: 'Slider silinirken hata oluştu'
    };
  }
}

export async function addImageToSlider(sliderId: string, imageData: Omit<SliderImage, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const sliderDoc = await getDoc(doc(db, 'sliders', sliderId));
    if (!sliderDoc.exists()) {
      return {
        success: false,
        message: 'Slider bulunamadı'
      };
    }
    
    const slider = sliderDoc.data() as SliderWidget;
    const newImage: SliderImage = {
      ...imageData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedImages = [...slider.images, newImage];
    
    await updateDoc(doc(db, 'sliders', sliderId), {
      images: updatedImages,
      updatedAt: new Date().toISOString()
    });
    
    await logActivity(`Slider'a resim eklendi: "${slider.title}"`, 'update');
    
    return {
      success: true,
      image: newImage,
      message: 'Resim başarıyla eklendi'
    };
  } catch (error) {
    console.error('Slider resim ekleme hatası:', error);
    return {
      success: false,
      message: 'Resim eklenirken hata oluştu'
    };
  }
}

export async function updateSliderImage(sliderId: string, imageId: string, updateData: Partial<SliderImage>) {
  try {
    const sliderDoc = await getDoc(doc(db, 'sliders', sliderId));
    if (!sliderDoc.exists()) {
      return {
        success: false,
        message: 'Slider bulunamadı'
      };
    }
    
    const slider = sliderDoc.data() as SliderWidget;
    const updatedImages = slider.images.map(img => 
      img.id === imageId 
        ? { ...img, ...updateData, updatedAt: new Date().toISOString() }
        : img
    );
    
    await updateDoc(doc(db, 'sliders', sliderId), {
      images: updatedImages,
      updatedAt: new Date().toISOString()
    });
    
    await logActivity(`Slider resmi güncellendi: "${slider.title}"`, 'update');
    
    return {
      success: true,
      message: 'Resim başarıyla güncellendi'
    };
  } catch (error) {
    console.error('Slider resim güncelleme hatası:', error);
    return {
      success: false,
      message: 'Resim güncellenirken hata oluştu'
    };
  }
}

export async function removeImageFromSlider(sliderId: string, imageId: string) {
  try {
    const sliderDoc = await getDoc(doc(db, 'sliders', sliderId));
    if (!sliderDoc.exists()) {
      return {
        success: false,
        message: 'Slider bulunamadı'
      };
    }
    
    const slider = sliderDoc.data() as SliderWidget;
    const updatedImages = slider.images.filter(img => img.id !== imageId);
    
    await updateDoc(doc(db, 'sliders', sliderId), {
      images: updatedImages,
      updatedAt: new Date().toISOString()
    });
    
    await logActivity(`Slider'dan resim silindi: "${slider.title}"`, 'update');
    
    return {
      success: true,
      message: 'Resim başarıyla silindi'
    };
  } catch (error) {
    console.error('Slider resim silme hatası:', error);
    return {
      success: false,
      message: 'Resim silinirken hata oluştu'
    };
  }
}

export async function reorderSliderImages(sliderId: string, imageIds: string[]) {
  try {
    const sliderDoc = await getDoc(doc(db, 'sliders', sliderId));
    if (!sliderDoc.exists()) {
      return {
        success: false,
        message: 'Slider bulunamadı'
      };
    }
    
    const slider = sliderDoc.data() as SliderWidget;
    const reorderedImages = imageIds.map((id, index) => {
      const image = slider.images.find(img => img.id === id);
      return image ? { ...image, order: index } : null;
    }).filter(Boolean) as SliderImage[];
    
    await updateDoc(doc(db, 'sliders', sliderId), {
      images: reorderedImages,
      updatedAt: new Date().toISOString()
    });
    
    await logActivity(`Slider resimleri yeniden sıralandı: "${slider.title}"`, 'update');
    
    return {
      success: true,
      message: 'Resimler başarıyla yeniden sıralandı'
    };
  } catch (error) {
    console.error('Slider resim sıralama hatası:', error);
    return {
      success: false,
      message: 'Resimler sıralanırken hata oluştu'
    };
  }
}

export async function toggleSliderStatus(id: string) {
  try {
    const sliderDoc = await getDoc(doc(db, 'sliders', id));
    if (!sliderDoc.exists()) {
      return {
        success: false,
        message: 'Slider bulunamadı'
      };
    }
    
    const slider = sliderDoc.data() as SliderWidget;
    const newStatus = !slider.isActive;
    
    await updateDoc(doc(db, 'sliders', id), {
      isActive: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    await logActivity(`Slider durumu değiştirildi: "${slider.title}" ${newStatus ? 'aktif' : 'pasif'} edildi`, 'update');
    
    return {
      success: true,
      message: `Slider ${newStatus ? 'aktif' : 'pasif'} edildi`
    };
  } catch (error) {
    console.error('Slider durum değiştirme hatası:', error);
    return {
      success: false,
      message: 'Slider durumu değiştirilirken hata oluştu'
    };
  }
}