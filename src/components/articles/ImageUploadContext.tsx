'use client';

import React, { createContext, useContext, useCallback } from 'react';

interface ImageUploadContextType {
  handleImageUpload: (file: File) => Promise<string>;
}

const ImageUploadContext = createContext<ImageUploadContextType | null>(null);

export function ImageUploadProvider({
  children,
  handleImageUpload,
}: {
  children: React.ReactNode;
  handleImageUpload: (file: File) => Promise<string>;
}) {
  return (
    <ImageUploadContext.Provider value={{ handleImageUpload }}>
      {children}
    </ImageUploadContext.Provider>
  );
}

export function useImageUploadContext() {
  return useContext(ImageUploadContext);
}

