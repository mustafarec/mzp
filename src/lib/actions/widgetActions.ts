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
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Widget } from '@/types';

export async function createWidget(widgetData: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const widget: Omit<Widget, 'id'> = {
      ...widgetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'widgets'), widget);
    
    return {
      success: true,
      widget: { ...widget, id: docRef.id },
      message: 'Widget başarıyla oluşturuldu'
    };
  } catch (error) {
    console.error('Widget oluşturma hatası:', error);
    return {
      success: false,
      message: 'Widget oluşturulurken hata oluştu'
    };
  }
}

export async function getWidgets() {
  try {
    const q = query(
      collection(db, 'widgets'),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);
    const widgets: Widget[] = [];
    
    snapshot.forEach((doc) => {
      widgets.push({ id: doc.id, ...doc.data() } as Widget);
    });

    return {
      success: true,
      widgets
    };
  } catch (error) {
    console.error('Widget listesi getirme hatası:', error);
    return {
      success: false,
      widgets: []
    };
  }
}

export async function getWidgetsByType(type: Widget['type']) {
  try {
    const q = query(
      collection(db, 'widgets'),
      where('type', '==', type),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);
    const widgets: Widget[] = [];
    
    snapshot.forEach((doc) => {
      widgets.push({ id: doc.id, ...doc.data() } as Widget);
    });

    return {
      success: true,
      widgets
    };
  } catch (error) {
    console.error('Widget türü getirme hatası:', error);
    return {
      success: false,
      widgets: []
    };
  }
}

export async function updateWidget(id: string, data: Partial<Widget>) {
  try {
    const docRef = doc(db, 'widgets', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: 'Widget başarıyla güncellendi'
    };
  } catch (error) {
    console.error('Widget güncelleme hatası:', error);
    return {
      success: false,
      message: 'Widget güncellenirken hata oluştu'
    };
  }
}

export async function deleteWidget(id: string) {
  try {
    const docRef = doc(db, 'widgets', id);
    await deleteDoc(docRef);
    
    return {
      success: true,
      message: 'Widget başarıyla silindi'
    };
  } catch (error) {
    console.error('Widget silme hatası:', error);
    return {
      success: false,
      message: 'Widget silinirken hata oluştu'
    };
  }
} 