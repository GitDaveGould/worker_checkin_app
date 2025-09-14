-- Migration: Create admin_settings table
-- Description: Creates the admin_settings table for system configuration

CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
    ('terms_and_conditions', 'By checking in, you agree to follow all event guidelines and safety protocols. You acknowledge that your participation is voluntary and at your own risk.', 'Terms and conditions text displayed during check-in'),
    ('question_1_options', '["First time volunteer", "Returning volunteer", "Staff member", "Contractor"]', 'JSON array of options for check-in question 1'),
    ('question_3_options_1', '["Morning", "Afternoon", "Evening", "All day"]', 'JSON array of options for check-in question 3 part 1'),
    ('question_3_options_2', '["Setup", "Event operations", "Cleanup", "Security", "Food service", "Other"]', 'JSON array of options for check-in question 3 part 2')
ON CONFLICT (setting_key) DO NOTHING;