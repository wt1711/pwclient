import React, { useCallback, useRef } from 'react';
import { Icon, IconButton, Icons } from 'folds';

interface InstagramImageUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function InstagramImageUploadButton({ onFilesSelected, disabled = false }: InstagramImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      onFilesSelected(imageFiles);
    }
    
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [onFilesSelected]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        variant="SurfaceVariant"
        size="300"
        radii="300"
        aria-label="Upload image"
      >
        <Icon src={Icons.Photo} />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
}