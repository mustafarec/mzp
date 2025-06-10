'use client';

import { usePathname } from 'next/navigation';
import FloatingAIChat from '@/components/ui/FloatingAIChat';

export default function ConditionalAIChat() {
  const pathname = usePathname();
  
  // Admin panelinde AI chat'i gösterme
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  return <FloatingAIChat />;
} 