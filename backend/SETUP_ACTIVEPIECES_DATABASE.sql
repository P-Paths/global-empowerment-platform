-- 🚀 SETUP ACTIVEPIECES DATABASE IN SUPABASE
-- Quick setup for 24/7 Activepieces operation

-- Create a separate database for Activepieces
-- Note: In Supabase, we'll use a separate schema instead of a separate database

-- Create Activepieces schema
CREATE SCHEMA IF NOT EXISTS activepieces;

-- Create Activepieces tables in the activepieces schema
CREATE TABLE IF NOT EXISTS activepieces.flow (
    id VARCHAR(21) PRIMARY KEY,
    project_id VARCHAR(21) NOT NULL,
    folder_id VARCHAR(21),
    version_id VARCHAR(21),
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'DISABLED',
    published_version_id VARCHAR(21),
    schedule_options JSONB,
    tags JSONB,
    display_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS activepieces.flow_version (
    id VARCHAR(21) PRIMARY KEY,
    flow_id VARCHAR(21) NOT NULL REFERENCES activepieces.flow(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    trigger JSONB NOT NULL,
    valid BOOLEAN NOT NULL DEFAULT FALSE,
    state VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version_number INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS activepieces.flow_run (
    id VARCHAR(21) PRIMARY KEY,
    project_id VARCHAR(21) NOT NULL,
    flow_id VARCHAR(21) NOT NULL,
    flow_version_id VARCHAR(21) NOT NULL,
    environment VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION',
    flow_display_name VARCHAR(255) NOT NULL,
    flow_version_id_display_name VARCHAR(255) NOT NULL,
    logs_file_id VARCHAR(21),
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finish_time TIMESTAMPTZ,
    logs_file_id_display_name VARCHAR(255),
    tasks BIGINT NOT NULL DEFAULT 0,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activepieces.connection (
    id VARCHAR(21) PRIMARY KEY,
    project_id VARCHAR(21) NOT NULL,
    name VARCHAR(255) NOT NULL,
    piece_name VARCHAR(255) NOT NULL,
    piece_version VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activepieces.app_credential (
    id VARCHAR(21) PRIMARY KEY,
    project_id VARCHAR(21) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flow_project_id ON activepieces.flow(project_id);
CREATE INDEX IF NOT EXISTS idx_flow_version_flow_id ON activepieces.flow_version(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_run_project_id ON activepieces.flow_run(project_id);
CREATE INDEX IF NOT EXISTS idx_flow_run_flow_id ON activepieces.flow_run(flow_id);
CREATE INDEX IF NOT EXISTS idx_connection_project_id ON activepieces.connection(project_id);
CREATE INDEX IF NOT EXISTS idx_app_credential_project_id ON activepieces.app_credential(project_id);

-- Grant permissions to service role
GRANT ALL ON SCHEMA activepieces TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA activepieces TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA activepieces TO service_role;

-- Success message
SELECT '✅ Activepieces database schema created successfully in Supabase!' as status;
