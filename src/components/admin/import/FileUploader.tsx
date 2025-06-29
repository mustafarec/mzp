'use client';

import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-admin-primary bg-admin-primary/5' : 'border-admin-border'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 mx-auto mb-4 text-admin-text-muted" />
      {isDragActive ? (
        <p className="text-admin-text-primary">Dosyayı buraya bırakın...</p>
      ) : (
        <div>
          <p className="text-lg font-medium mb-2 text-admin-text-primary">
            Excel dosyasını sürükleyip bırakın
          </p>
          <p className="text-admin-text-secondary">
            veya dosya seçmek için tıklayın
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;