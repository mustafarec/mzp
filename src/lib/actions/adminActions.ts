import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc } from 'firebase/firestore';

export const addAdmin = async (email: string) => {
  try {
    // Email zaten admin mi kontrol et
    const adminQuery = query(collection(db, 'admins'), where('email', '==', email));
    const querySnapshot = await getDocs(adminQuery);
    
    if (!querySnapshot.empty) {
      throw new Error('Bu email adresi zaten admin listesinde');
    }

    // Yeni admin ekle
    await addDoc(collection(db, 'admins'), {
      email: email,
      addedAt: new Date(),
      status: 'active'
    });

    return { success: true, message: 'Admin başarıyla eklendi' };
  } catch (error: any) {
    console.error('Admin ekleme hatası:', error);
    return { success: false, message: error.message };
  }
};

export const removeAdmin = async (email: string) => {
  try {
    // Admin'i bul
    const adminQuery = query(collection(db, 'admins'), where('email', '==', email));
    const querySnapshot = await getDocs(adminQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Bu email adresi admin listesinde bulunamadı');
    }

    // Admin'i sil
    const adminDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, 'admins', adminDoc.id));

    return { success: true, message: 'Admin başarıyla silindi' };
  } catch (error: any) {
    console.error('Admin silme hatası:', error);
    return { success: false, message: error.message };
  }
};

export const getAdminList = async () => {
  try {
    const adminQuery = query(collection(db, 'admins'));
    const querySnapshot = await getDocs(adminQuery);
    
    const admins = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: admins };
  } catch (error: any) {
    console.error('Admin listesi getirme hatası:', error);
    return { success: false, message: error.message };
  }
};

// İlk admin ekleme fonksiyonu (sadece setup için)
export const setupInitialAdmin = async (email: string) => {
  try {
    const adminQuery = query(collection(db, 'admins'));
    const querySnapshot = await getDocs(adminQuery);
    
    // Hiç admin yoksa ilk admin'i ekle
    if (querySnapshot.empty) {
      await addDoc(collection(db, 'admins'), {
        email: email,
        addedAt: new Date(),
        status: 'active',
        role: 'super-admin'
      });
      return { success: true, message: 'İlk admin oluşturuldu' };
    }
    
    return { success: false, message: 'Admin sistemi zaten kurulu' };
  } catch (error: any) {
    console.error('İlk admin oluşturma hatası:', error);
    return { success: false, message: error.message };
  }
}; 