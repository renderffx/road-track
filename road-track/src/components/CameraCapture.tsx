'use client';

import { useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

interface CameraCaptureProps {
  onCapture: (file: File, preview: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onCapture(file, result);
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) handleFile(acceptedFiles[0]);
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const openCamera = () => fileInputRef.current?.click();
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
      
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden animate-in fade-in duration-200">
          <div className="aspect-video relative bg-zinc-100 dark:bg-zinc-800">
            <Image src={preview} alt="Captured" fill className="object-cover" unoptimized />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <button onClick={clearImage} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remove
            </button>
            <button onClick={openCamera} className="flex-1 py-3 rounded-xl bg-white/90 dark:bg-black/90 font-medium hover:bg-white dark:hover:bg-black transition-colors flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              New Photo
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-800/50' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className={`w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5 transition-transform ${isDragActive ? 'scale-110' : ''}`}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isDragActive ? 'text-black dark:text-white' : 'text-zinc-400'}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          
          <p className="text-lg font-semibold mb-2">
            {isDragActive ? 'Drop image here' : 'Take or Upload Photo'}
          </p>
          <p className="text-sm text-zinc-500 mb-6">JPG, PNG, WebP up to 10MB</p>
          
          <div className="flex justify-center gap-3">
            <button type="button" onClick={(e) => { e.stopPropagation(); openCamera(); }} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Camera
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="px-6 py-3 border-2 border-zinc-200 dark:border-zinc-700 font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Gallery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
