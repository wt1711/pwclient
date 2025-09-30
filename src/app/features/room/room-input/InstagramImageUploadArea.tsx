import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Icon, IconButton, Icons, Text, Spinner } from 'folds';
import { InstagramImageUpload, useInstagramImageUploads } from './hooks/useInstagramImageUploads';

interface InstagramImageUploadAreaProps {
  contactId: string;
  onImageSent?: () => void;
}

export function InstagramImageUploadArea({ contactId, onImageSent }: InstagramImageUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [caption, setCaption] = useState('');
  const imageUploads = useInstagramImageUploads(contactId, onImageSent);

  const handleFileSelect = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      imageUploads.handleFiles(imageFiles);
    }
  }, [imageUploads]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFileSelect(files);
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleSendImage = useCallback(async (upload: InstagramImageUpload) => {
    console.log('🎯 handleSendImage called with upload:', upload);
    try {
      console.log('📞 Calling imageUploads.sendImage...');
      await imageUploads.sendImage(upload, caption.trim() || undefined);
      console.log('✅ handleSendImage completed successfully');
      setCaption('');
      onImageSent?.();
    } catch (error) {
      console.error('❌ Failed to send image in handleSendImage:', error);
    }
  }, [imageUploads, caption, onImageSent]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (imageUploads.uploads.length === 0) {
    return (
      <Box
        direction="Column"
        alignItems="Center"
        justifyContent="Center"
        gap="200"
        style={{
          padding: '16px',
          border: dragOver ? '2px dashed var(--bg-primary)' : '2px dashed var(--bg-surface-variant)',
          borderRadius: '8px',
          backgroundColor: dragOver ? 'var(--bg-primary-soft)' : 'transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handlePickFile}
      >
        <Icon src={Icons.Photo} size="400" />
        <Text size="T300" priority="300">
          {dragOver ? 'Drop images here' : 'Click or drag images to upload'}
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </Box>
    );
  }

  return (
    <Box direction="Column" gap="200">
      {imageUploads.uploads.map((upload) => (
        <Box
          key={upload.id}
          direction="Row"
          alignItems="Center"
          gap="200"
          style={{
            padding: '12px',
            border: '1px solid var(--bg-surface-variant)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Box
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {upload.file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(upload.file)}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Icon src={Icons.Photo} />
            )}
          </Box>
          
          <Box grow="Yes" direction="Column" gap="100">
            <Text size="T300" truncate>
              {upload.file.name}
            </Text>
            <Text size="T200" priority="300">
              {(upload.file.size / 1024 / 1024).toFixed(2)} MB
            </Text>
            {upload.status === 'error' && upload.error && (
              <Text size="T200" style={{ color: 'var(--tc-danger)' }}>
                {upload.error}
              </Text>
            )}
          </Box>

          <Box direction="Row" alignItems="Center" gap="100">
            {upload.status === 'uploading' && <Spinner size="300" />}
            {upload.status === 'error' && (
              <>
                <IconButton
                  onClick={() => handleSendImage(upload)}
                  variant="SurfaceVariant"
                  size="300"
                  radii="300"
                >
                  <Icon src={Icons.ArrowGoRight} />
                </IconButton>
                <IconButton
                  onClick={() => imageUploads.removeUpload(upload.id)}
                  variant="SurfaceVariant"
                  size="300"
                  radii="300"
                >
                  <Icon src={Icons.Cross} />
                </IconButton>
              </>
            )}
            {(upload.status === 'pending') && (
              <>
                <Button
                  onClick={() => handleSendImage(upload)}
                  variant="Primary"
                  size="300"
                >
                  Send
                </Button>
                <IconButton
                  onClick={() => imageUploads.removeUpload(upload.id)}
                  variant="SurfaceVariant"
                  size="300"
                  radii="300"
                >
                  <Icon src={Icons.Cross} />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      ))}
      
      {imageUploads.uploads.some(u => u.status === 'pending') && (
        <Box direction="Column" gap="100">
          <Text size="T300" priority="300">
            Add a caption (optional):
          </Text>
          <Box
            as="textarea"
            value={caption}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            style={{
              padding: '8px 12px',
              border: '1px solid var(--bg-surface-variant)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--tc-surface-normal)',
              resize: 'vertical',
              minHeight: '60px',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        </Box>
      )}

      <Box direction="Row" gap="200">
        <Button
          onClick={handlePickFile}
          variant="Secondary"
          size="300"
        >
          <Icon src={Icons.Plus} size="100" />
          Add More Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </Box>
    </Box>
  );
}