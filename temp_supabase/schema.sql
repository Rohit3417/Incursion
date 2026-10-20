-- Enable the pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    content_hash TEXT UNIQUE NOT NULL,
    teams_json JSONB NOT NULL,
    validation_report_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_preset BOOLEAN DEFAULT FALSE,
    config_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    config_snapshot_json JSONB NOT NULL,
    run_hash TEXT UNIQUE NOT NULL,
    results_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL,
    action TEXT CHECK (action IN ('pin', 'exclude', 'waitlist')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Configuration
-- For backend API access using the anon key, disable RLS or allow full access:
ALTER TABLE datasets DISABLE ROW LEVEL SECURITY;
ALTER TABLE configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE overrides DISABLE ROW LEVEL SECURITY;