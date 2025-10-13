-- Migration: Add encrypted_password column to matrix_user
-- Description: Store encrypted Matrix password (AES-256-GCM encoded as hex parts)

ALTER TABLE matrix_user
    ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

COMMENT ON COLUMN matrix_user.encrypted_password IS 'AES-256-GCM encrypted Matrix password, formatted as iv:tag:ciphertext (hex)';