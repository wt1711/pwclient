import { useCallback, useState } from 'react';
import { sendInstagramImage } from '../../../../services/instagramApi';

export interface InstagramImageUpload {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function useInstagramImageUploads(
  contactId: string, 
  onMessageSent?: (message: any) => void
) {
  const [uploads, setUploads] = useState<InstagramImageUpload[]>([]);

  const handleFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      const newUploads: InstagramImageUpload[] = imageFiles.map(file => ({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: 'pending' as const,
      }));
      
      setUploads(prev => [...prev, ...newUploads]);
      return newUploads;
    },
    []
  );

  const sendImage = useCallback(
    async (upload: InstagramImageUpload, caption?: string) => {
      console.log('🔄 sendImage called with:', { uploadId: upload.id, contactId, caption });
      
      setUploads(prev => 
        prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'uploading' as const }
            : u
        )
      );

      try {
        console.log('📤 Calling sendInstagramImage API...');
        // Direct upload to Instagram via backend API
        const message = await sendInstagramImage(contactId, upload.file, caption);
        console.log('✅ sendInstagramImage success:', message);
        
        // Add the message to the chat UI immediately
        if (onMessageSent) {
          console.log('📝 Adding image message to chat UI:', message);
          onMessageSent(message);
        }
        
        // Remove the upload from the list after successful send
        setUploads(prev => prev.filter(u => u.id !== upload.id));
        
        return message;
      } catch (error) {
        console.error('❌ Failed to send Instagram image:', error);
        setUploads(prev => 
          prev.map(u => 
            u.id === upload.id 
              ? { ...u, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
              : u
          )
        );
        throw error;
      }
    },
    [contactId, onMessageSent]
  );

  const removeUpload = useCallback(
    (uploadId: string) => {
      setUploads(prev => prev.filter(u => u.id !== uploadId));
    },
    []
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    handleFiles,
    sendImage,
    removeUpload,
    clearUploads,
  };
}