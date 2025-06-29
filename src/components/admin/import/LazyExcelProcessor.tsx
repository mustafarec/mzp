'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface ExcelProduct {
  İsim: string;
  Açıklama: string;
  SKU?: string;
  Marka?: string;
  Kategoriler: string;
  'Resim URL': string;
}

interface LazyExcelProcessorProps {
  file: File;
  onProductsLoaded: (products: ExcelProduct[]) => void;
  onError: (error: string) => void;
}

// Loading component
const ExcelProcessorLoading = () => (
  <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">Excel işleyici yükleniyor...</p>
      <p className="text-sm text-gray-500 mt-1">XLSX kütüphanesi hazırlanıyor</p>
    </div>
  </div>
);

// Dynamic Excel processor
const ExcelProcessor = dynamic(
  () => import('./ExcelProcessor'),
  { 
    loading: () => <ExcelProcessorLoading />, 
    ssr: false 
  }
);

const LazyExcelProcessor: React.FC<LazyExcelProcessorProps> = ({ file, onProductsLoaded, onError }) => {
  return <ExcelProcessor file={file} onProductsLoaded={onProductsLoaded} onError={onError} />;
};

export default LazyExcelProcessor;