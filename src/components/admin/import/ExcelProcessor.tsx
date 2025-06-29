'use client';

import { useEffect } from 'react';

interface ExcelProduct {
  İsim: string;
  Açıklama: string;
  SKU?: string;
  Marka?: string;
  Kategoriler: string;
  'Resim URL': string;
}

interface ExcelProcessorProps {
  file: File;
  onProductsLoaded: (products: ExcelProduct[]) => void;
  onError: (error: string) => void;
}

const ExcelProcessor: React.FC<ExcelProcessorProps> = ({ file, onProductsLoaded, onError }) => {
  useEffect(() => {
    const processFile = async () => {
      try {
        // Dynamic import of XLSX
        const XLSX = await import('xlsx');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelProduct[];
            
            onProductsLoaded(jsonData);
          } catch (error) {
            onError('Excel dosyası okunamadı');
          }
        };
        
        reader.onerror = () => {
          onError('Dosya okuma hatası');
        };
        
        reader.readAsBinaryString(file);
      } catch (error) {
        onError('Excel işleyici yüklenemedi');
      }
    };

    if (file) {
      processFile();
    }
  }, [file, onProductsLoaded, onError]);

  return null; // This is a processing component, no UI needed
};

export default ExcelProcessor;