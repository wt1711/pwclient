-- Migration: create payments table with matrix user and host
-- Created: 2025-09-27
-- Description: Create payments table with matrix_user_id and matrix_host as unique combination

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    matrix_user_id VARCHAR(255) NOT NULL,
    matrix_host VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_type VARCHAR(50) DEFAULT 'ai-assistance',
    amount_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint on matrix_user_id and matrix_host combination
    UNIQUE(matrix_user_id, matrix_host)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_matrix_user_id ON payments(matrix_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_matrix_host ON payments(matrix_host);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores payment information for Matrix users';
COMMENT ON COLUMN payments.matrix_user_id IS 'Matrix user ID (e.g., @user:matrix.org)';
COMMENT ON COLUMN payments.matrix_host IS 'Matrix homeserver host (e.g., matrix.org)';
COMMENT ON COLUMN payments.payment_id IS 'Internal payment identifier';
COMMENT ON COLUMN payments.payment_status IS 'Payment status: pending, completed, failed, cancelled';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: ai-assistance, premium, etc.';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for tracking';

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
