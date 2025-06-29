"use client";

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface ScrollPositionOptions {
  key?: string;
  restoreDelay?: number;
  autoSave?: boolean;
}

export function useScrollPosition(options: ScrollPositionOptions = {}) {
  const { key = 'scrollPosition', restoreDelay = 100, autoSave = true } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialLoad = useRef(true);
  const hasScrollRestored = useRef(false);

  const saveScrollPosition = (position?: number) => {
    const currentPosition = position ?? window.scrollY;
    const fullKey = `${key}_${pathname}`;
    sessionStorage.setItem(fullKey, currentPosition.toString());
    
    const urlParams = new URLSearchParams(searchParams.toString());
    if (currentPosition > 0) {
      urlParams.set('scroll', currentPosition.toString());
    } else {
      urlParams.delete('scroll');
    }
    
    const newUrl = `${pathname}?${urlParams.toString()}`;
    if (newUrl !== `${pathname}?${searchParams.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
  };

  const restoreScrollPosition = () => {
    if (hasScrollRestored.current) return;

    const scrollFromUrl = searchParams.get('scroll');
    const fullKey = `${key}_${pathname}`;
    const scrollFromStorage = sessionStorage.getItem(fullKey);
    
    const targetPosition = scrollFromUrl || scrollFromStorage;
    
    if (targetPosition) {
      const position = parseInt(targetPosition);
      if (!isNaN(position) && position > 0) {
        const attemptScroll = () => {
          const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
          
          if (documentHeight > position + window.innerHeight) {
            window.scrollTo({ top: position, behavior: 'smooth' });
            hasScrollRestored.current = true;
          } else {
            setTimeout(attemptScroll, 200);
          }
        };
        
        setTimeout(attemptScroll, restoreDelay);
      }
    }
  };

  const clearScrollPosition = () => {
    const fullKey = `${key}_${pathname}`;
    sessionStorage.removeItem(fullKey);
    
    const urlParams = new URLSearchParams(searchParams.toString());
    urlParams.delete('scroll');
    const newUrl = `${pathname}?${urlParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  useEffect(() => {
    if (isInitialLoad.current) {
      restoreScrollPosition();
      isInitialLoad.current = false;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!autoSave) return;

    const handleScroll = () => {
      if (hasScrollRestored.current) {
        saveScrollPosition();
      }
    };

    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [autoSave, pathname]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
} 