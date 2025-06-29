'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

const TemplateDownloader: React.FC = () => {
  const downloadTemplate = async () => {
    try {
      // Dynamic import of XLSX
      const XLSX = await import('xlsx');
      
      const templateData = [
        {
          'İsim': 'Örnek Ürün Adı',
          'Açıklama': 'Ürün açıklaması buraya yazılacak',
          'SKU': 'SKU001',
          'Marka': 'Marka Adı',
          'Kategoriler': 'Elektronik',
          'Resim URL': 'https://example.com/image.jpg'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
      XLSX.writeFile(wb, 'urun-import-template.xlsx');
    } catch (error) {
      console.error('Template download error:', error);
    }
  };

  return (
    <Button 
      onClick={downloadTemplate} 
      variant="outline" 
      className="border-admin-border hover:bg-admin-muted text-admin-text-primary"
    >
      <FileText className="h-4 w-4 mr-2" />
      Excel Şablonu İndir
    </Button>
  );
};

export default TemplateDownloader;