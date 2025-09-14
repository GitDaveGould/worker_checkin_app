import { executeQuery, executeQuerySingle, convertRowToCamelCase } from '../utils/database';
import { AdminSettings } from '../../shared/types';

export interface AdminSettingRow {
  id: number;
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt: string;
}

export class AdminSettingsModel {
  // Get a specific setting by key
  static async getSetting(key: string): Promise<string | null> {
    const query = 'SELECT setting_value FROM admin_settings WHERE setting_key = $1';
    const result = await executeQuerySingle<{ setting_value: string }>(query, [key]);
    return result?.setting_value || null;
  }

  // Get all settings as an object
  static async getAllSettings(): Promise<AdminSettings> {
    const query = 'SELECT setting_key, setting_value FROM admin_settings ORDER BY setting_key';
    const result = await executeQuery<{ setting_key: string; setting_value: string }>(query);
    
    const settings: AdminSettings = {
      termsAndConditions: '',
      question1Options: [],
      question3Options1: [],
      question3Options2: []
    };

    result.rows.forEach(row => {
      switch (row.setting_key) {
        case 'terms_and_conditions':
          settings.termsAndConditions = row.setting_value;
          break;
        case 'question_1_options':
          try {
            settings.question1Options = JSON.parse(row.setting_value);
          } catch {
            settings.question1Options = [];
          }
          break;
        case 'question_3_options_1':
          try {
            settings.question3Options1 = JSON.parse(row.setting_value);
          } catch {
            settings.question3Options1 = [];
          }
          break;
        case 'question_3_options_2':
          try {
            settings.question3Options2 = JSON.parse(row.setting_value);
          } catch {
            settings.question3Options2 = [];
          }
          break;
      }
    });

    return settings;
  }

  // Get all settings with metadata
  static async getAllSettingsWithMetadata(): Promise<AdminSettingRow[]> {
    const query = 'SELECT * FROM admin_settings ORDER BY setting_key';
    const result = await executeQuery<any>(query);
    return result.rows.map(row => convertRowToCamelCase<AdminSettingRow>(row));
  }

  // Update a specific setting
  static async updateSetting(key: string, value: string): Promise<boolean> {
    const query = `
      UPDATE admin_settings 
      SET setting_value = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE setting_key = $2
    `;
    
    const result = await executeQuery(query, [value, key]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Update multiple settings at once
  static async updateSettings(settings: Partial<AdminSettings>): Promise<boolean> {
    const updates: Array<{ key: string; value: string }> = [];

    if (settings.termsAndConditions !== undefined) {
      updates.push({
        key: 'terms_and_conditions',
        value: settings.termsAndConditions
      });
    }

    if (settings.question1Options !== undefined) {
      updates.push({
        key: 'question_1_options',
        value: JSON.stringify(settings.question1Options)
      });
    }

    if (settings.question3Options1 !== undefined) {
      updates.push({
        key: 'question_3_options_1',
        value: JSON.stringify(settings.question3Options1)
      });
    }

    if (settings.question3Options2 !== undefined) {
      updates.push({
        key: 'question_3_options_2',
        value: JSON.stringify(settings.question3Options2)
      });
    }

    if (updates.length === 0) {
      return true; // No updates needed
    }

    // Execute all updates
    const promises = updates.map(update => 
      this.updateSetting(update.key, update.value)
    );

    const results = await Promise.all(promises);
    return results.every(result => result === true);
  }

  // Create or update a setting (upsert)
  static async upsertSetting(key: string, value: string, description?: string): Promise<boolean> {
    const query = `
      INSERT INTO admin_settings (setting_key, setting_value, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = COALESCE(EXCLUDED.description, admin_settings.description),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const result = await executeQuery(query, [key, value, description]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Delete a setting
  static async deleteSetting(key: string): Promise<boolean> {
    const query = 'DELETE FROM admin_settings WHERE setting_key = $1';
    const result = await executeQuery(query, [key]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Get terms and conditions (commonly used)
  static async getTermsAndConditions(): Promise<string> {
    const terms = await this.getSetting('terms_and_conditions');
    return terms || 'No terms and conditions have been set.';
  }

  // Get question 1 options
  static async getQuestion1Options(): Promise<string[]> {
    const options = await this.getSetting('question_1_options');
    if (!options) return [];
    
    try {
      return JSON.parse(options);
    } catch {
      return [];
    }
  }

  // Get question 3 options (both parts)
  static async getQuestion3Options(): Promise<{
    options1: string[];
    options2: string[];
  }> {
    const [options1Str, options2Str] = await Promise.all([
      this.getSetting('question_3_options_1'),
      this.getSetting('question_3_options_2')
    ]);

    let options1: string[] = [];
    let options2: string[] = [];

    try {
      options1 = options1Str ? JSON.parse(options1Str) : [];
    } catch {
      options1 = [];
    }

    try {
      options2 = options2Str ? JSON.parse(options2Str) : [];
    } catch {
      options2 = [];
    }

    return { options1, options2 };
  }

  // Update terms and conditions
  static async updateTermsAndConditions(terms: string): Promise<boolean> {
    return this.updateSetting('terms_and_conditions', terms);
  }

  // Update question 1 options
  static async updateQuestion1Options(options: string[]): Promise<boolean> {
    return this.updateSetting('question_1_options', JSON.stringify(options));
  }

  // Update question 3 options
  static async updateQuestion3Options(options1: string[], options2: string[]): Promise<boolean> {
    const results = await Promise.all([
      this.updateSetting('question_3_options_1', JSON.stringify(options1)),
      this.updateSetting('question_3_options_2', JSON.stringify(options2))
    ]);
    
    return results.every(result => result === true);
  }

  // Initialize default settings (for setup)
  static async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        key: 'terms_and_conditions',
        value: 'By checking in, you agree to follow all event guidelines and safety protocols. You acknowledge that your participation is voluntary and at your own risk.',
        description: 'Terms and conditions text displayed during check-in'
      },
      {
        key: 'question_1_options',
        value: JSON.stringify(['First time volunteer', 'Returning volunteer', 'Staff member', 'Contractor']),
        description: 'JSON array of options for check-in question 1'
      },
      {
        key: 'question_3_options_1',
        value: JSON.stringify(['Morning', 'Afternoon', 'Evening', 'All day']),
        description: 'JSON array of options for check-in question 3 part 1'
      },
      {
        key: 'question_3_options_2',
        value: JSON.stringify(['Setup', 'Event operations', 'Cleanup', 'Security', 'Food service', 'Other']),
        description: 'JSON array of options for check-in question 3 part 2'
      }
    ];

    for (const setting of defaults) {
      await this.upsertSetting(setting.key, setting.value, setting.description);
    }
  }

  // Validate settings before saving
  static validateSettings(settings: Partial<AdminSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.termsAndConditions !== undefined) {
      if (typeof settings.termsAndConditions !== 'string') {
        errors.push('Terms and conditions must be a string');
      } else if (settings.termsAndConditions.trim().length === 0) {
        errors.push('Terms and conditions cannot be empty');
      }
    }

    if (settings.question1Options !== undefined) {
      if (!Array.isArray(settings.question1Options)) {
        errors.push('Question 1 options must be an array');
      } else if (settings.question1Options.length === 0) {
        errors.push('Question 1 options cannot be empty');
      } else if (!settings.question1Options.every(opt => typeof opt === 'string' && opt.trim().length > 0)) {
        errors.push('All question 1 options must be non-empty strings');
      }
    }

    if (settings.question3Options1 !== undefined) {
      if (!Array.isArray(settings.question3Options1)) {
        errors.push('Question 3 options 1 must be an array');
      } else if (settings.question3Options1.length === 0) {
        errors.push('Question 3 options 1 cannot be empty');
      } else if (!settings.question3Options1.every(opt => typeof opt === 'string' && opt.trim().length > 0)) {
        errors.push('All question 3 options 1 must be non-empty strings');
      }
    }

    if (settings.question3Options2 !== undefined) {
      if (!Array.isArray(settings.question3Options2)) {
        errors.push('Question 3 options 2 must be an array');
      } else if (settings.question3Options2.length === 0) {
        errors.push('Question 3 options 2 cannot be empty');
      } else if (!settings.question3Options2.every(opt => typeof opt === 'string' && opt.trim().length > 0)) {
        errors.push('All question 3 options 2 must be non-empty strings');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}