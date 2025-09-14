-- Migration: Create checkins table
-- Description: Creates the checkins table for recording worker check-ins

CREATE TABLE IF NOT EXISTS checkins (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    question_1_response VARCHAR(255) NOT NULL,
    question_2_response BOOLEAN NOT NULL,
    question_3_response_1 VARCHAR(255) NOT NULL,
    question_3_response_2 VARCHAR(255) NOT NULL,
    terms_accepted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one check-in per worker per event
    CONSTRAINT unique_worker_event_checkin UNIQUE(worker_id, event_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_checkins_worker_id ON checkins(worker_id);
CREATE INDEX IF NOT EXISTS idx_checkins_event_id ON checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_worker_event ON checkins(worker_id, event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_timestamp ON checkins(timestamp);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at);

-- Index for reporting queries (by date range)
CREATE INDEX IF NOT EXISTS idx_checkins_date_range ON checkins(DATE(timestamp));

-- Composite index for dashboard queries (current event check-ins)
CREATE INDEX IF NOT EXISTS idx_checkins_event_date ON checkins(event_id, DATE(timestamp));