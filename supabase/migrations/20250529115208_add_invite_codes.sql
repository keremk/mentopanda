-- Create invite_codes table
CREATE TABLE invite_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expire_by INTEGER DEFAULT 5 NOT NULL,
    validated BOOLEAN DEFAULT FALSE NOT NULL,
    created_for TEXT NULL
);

-- Create index on code for fast lookups
CREATE INDEX idx_invite_codes_code ON invite_codes(code);

-- Create index on created_by for user queries
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);

-- Create index on created_at for cleanup/expiry queries
CREATE INDEX idx_invite_codes_created_at ON invite_codes(created_at);
