'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';

// Loading component
const TemplateDownloaderLoading = () => (
  <Button variant="outline" disabled className="border-admin-border text-admin-text-primary">
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    Excel kütüphanesi yükleniyor...
  </Button>
);

// Dynamic template downloader
const TemplateDownloader = dynamic(
  () => import('./TemplateDownloader'),
  { 
    loading: () => <TemplateDownloaderLoading />, 
    ssr: false 
  }
);

const LazyTemplateDownloader: React.FC = () => {
  return <TemplateDownloader />;
};

export default LazyTemplateDownloader;