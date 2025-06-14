"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';

export function useAdmin() {
  const [user, loading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);

  // Firebase'den admin listesini dinle
  useEffect(() => {
    const adminQuery = query(collection(db, 'admins'));
    const unsubscribe = onSnapshot(adminQuery, (snapshot) => {
      const emails = snapshot.docs.map(doc => doc.data().email);
      setAdminEmails(emails);
      setAdminLoading(false);
      console.log('🔍 Admin emails from Firebase:', emails);
      console.log('📊 Total admin count:', emails.length);
    }, (error) => {
      console.error('❌ Admin emails fetch error:', error);
      setAdminLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Kullanıcı admin mi kontrol et
  useEffect(() => {
    if (user?.email && !adminLoading) {
      const isUserAdmin = adminEmails.includes(user.email);
      setIsAdmin(isUserAdmin);
      console.log('🔐 User admin check:', {
        userEmail: user.email,
        adminEmails,
        isAdmin: isUserAdmin,
        adminEmailsCount: adminEmails.length,
        adminLoadingComplete: !adminLoading
      });
      
      if (!isUserAdmin && adminEmails.length > 0) {
        console.warn('⚠️ User is not admin! Email not found in admin list.');
      }
    } else {
      setIsAdmin(false);
      console.log('🔄 Admin check skipped:', {
        hasUser: !!user?.email,
        adminLoading,
        userEmail: user?.email || 'none'
      });
    }
  }, [user?.email, adminEmails, adminLoading]);

  return {
    user,
    isAdmin,
    loading: loading || adminLoading,
    error,
    adminEmails
  };
} 