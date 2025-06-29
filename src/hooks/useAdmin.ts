"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';

export function useAdmin() {
  const [user, authLoading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Firebase'den admin listesini dinle - optimize edilmiş
  useEffect(() => {
    const adminQuery = query(collection(db, 'admins'));
    const unsubscribe = onSnapshot(adminQuery, (snapshot) => {
      const emails = snapshot.docs.map(doc => doc.data().email);
      setAdminEmails(emails);
      setAdminLoading(false);
    }, (error) => {
      console.error('Admin listesi yüklenirken hata:', error);
      setAdminLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Kullanıcı admin mi kontrol et - timing iyileştirmesi
  const userEmail = user?.email;
  useEffect(() => {
    // Auth loading tamamlanana kadar bekle
    if (authLoading) {
      setAdminCheckComplete(false);
      return;
    }

    // Kullanıcı yoksa admin değil
    if (!user || !userEmail) {
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return;
    }

    // Admin listesi yüklenene kadar bekle
    if (adminLoading) {
      setAdminCheckComplete(false);
      return;
    }

    // Admin kontrolü yap
    const isUserAdmin = adminEmails.includes(userEmail);
    setIsAdmin(isUserAdmin);
    setAdminCheckComplete(true);
  }, [user, userEmail, authLoading, adminEmails, adminLoading]);

  // Loading state'ini daha akıllı hesapla
  const isFullyLoaded = !authLoading && !adminLoading && adminCheckComplete;
  const loading = !isFullyLoaded;

  // Return object'i memoize et
  return useMemo(() => ({
    user,
    isAdmin,
    loading,
    error,
    adminEmails,
    // Debug için ek bilgiler
    authLoading,
    adminLoading,
    adminCheckComplete
  }), [user, isAdmin, loading, error, adminEmails, authLoading, adminLoading, adminCheckComplete]);
} 