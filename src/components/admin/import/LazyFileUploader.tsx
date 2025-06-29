'use client';

import dynamic from 'next/dynamic';
import { Loader2, Upload } from 'lucide-react';

interface LazyFileUploaderProps {
  onFileSelected: (file: File) => void;
}

// Loading component
const FileUploaderLoading = () => (
  <div className="border-2 border-dashed rounded-lg p-8 text-center border-admin-border bg-gray-50">
    <div className="flex flex-col items-center">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
      <p className="text-lg font-medium mb-2 text-admin-text-primary">
        Dosya yükleyici hazırlanıyor...
      </p>
      <p className="text-admin-text-secondary text-sm">
        Drag & drop kütüphanesi yükleniyor
      </p>
    </div>
  </div>
);

// Dynamic file uploader
const FileUploader = dynamic(
  () => import('./FileUploader'),
  { 
    loading: () => <FileUploaderLoading />, 
    ssr: false 
  }
);

const LazyFileUploader: React.FC<LazyFileUploaderProps> = ({ onFileSelected }) => {
  return <FileUploader onFileSelected={onFileSelected} />;
};

export default LazyFileUploader;