#!/usr/bin/env tsx
// SAVAGE DATA SEEDING SCRIPT - POPULATE THE BATTLEFIELD!!! 🌱🔥🌱

import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

async function seedData() {
  console.log('🌱 SEEDING DATA - POPULATING THE BATTLEFIELD!!! 💀');
  
  try {
    // Seed admin settings
    console.log('⚡ Seeding admin settings...');
    await pool.query(`
      INSERT INTO admin_settings (key, value) VALUES
      ('termsAndConditions', '<h2>Terms and Conditions</h2><p>By checking in to this event, you agree to the following terms and conditions:</p><ul><li>You will follow all event rules and guidelines</li><li>You understand that your participation is voluntary</li><li>You agree to treat all staff and attendees with respect</li><li>You will not engage in any illegal activities</li></ul><p>Thank you for your participation!</p>'),
      ('question1Options', '["Social Media", "Friend/Colleague", "Website", "Email Newsletter", "Previous Event", "Other"]'),
      ('question3Options1', '["Networking", "Learning/Education", "Job Opportunities", "Community Involvement", "Personal Interest", "Other"]'),
      ('question3Options2', '["Beginner", "Intermediate", "Advanced", "Expert", "Not Applicable"]')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);

    // Seed sample events
    console.log('🎭 Seeding sample events...');
    await pool.query(`
      INSERT INTO events (name, start_date, end_date, location, is_active) VALUES
      ('Tech Conference 2024', '2024-06-15', '2024-06-17', 'Convention Center Downtown', true),
      ('Summer Music Festival', '2024-07-20', '2024-07-22', 'City Park Amphitheater', false),
      ('Business Networking Event', '2024-08-10', '2024-08-10', 'Hotel Grand Ballroom', false),
      ('Community Volunteer Day', '2024-09-05', '2024-09-05', 'Community Center', false),
      ('Holiday Celebration', '2024-12-15', '2024-12-15', 'Town Square', false)
      ON CONFLICT DO NOTHING
    `);

    // Seed sample workers (for demo purposes)
    console.log('👥 Seeding sample workers...');
    await pool.query(`
      INSERT INTO workers (first_name, last_name, date_of_birth, email, phone, street_address, city, state, zip_code, country) VALUES
      ('John', 'Doe', '1990-01-15', 'john.doe@example.com', '555-0101', '123 Main St', 'Anytown', 'CA', '12345', 'USA'),
      ('Jane', 'Smith', '1985-05-22', 'jane.smith@example.com', '555-0102', '456 Oak Ave', 'Somewhere', 'NY', '67890', 'USA'),
      ('Mike', 'Johnson', '1992-11-08', 'mike.johnson@example.com', '555-0103', '789 Pine Rd', 'Elsewhere', 'TX', '11111', 'USA'),
      ('Sarah', 'Williams', '1988-03-30', 'sarah.williams@example.com', '555-0104', '321 Elm St', 'Nowhere', 'FL', '22222', 'USA'),
      ('David', 'Brown', '1995-09-12', 'david.brown@example.com', '555-0105', '654 Maple Dr', 'Anywhere', 'WA', '33333', 'USA')
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('✅ Data seeding completed successfully!');
    console.log('🔥 THE BATTLEFIELD IS READY FOR BATTLE!!! 💀');
    
  } catch (error) {
    console.error('💀 Seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedData();
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
