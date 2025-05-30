-- Create waiting_list table
CREATE TABLE waiting_list (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    comment TEXT,
    date_requested TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for efficient lookups
CREATE INDEX idx_waiting_list_email ON waiting_list(email);

-- Create index on date_requested for efficient ordering
CREATE INDEX idx_waiting_list_date_requested ON waiting_list(date_requested DESC);
