import React, { useState, useEffect } from 'react';
import { adminSettingsApi, AdminApiError } from '../../utils/adminApi';

interface AdminSettings {
  termsAndConditions: string;
  question1Options: string[];
  question3Options1: string[];
  question3Options2: string[];
}

interface SystemConfig {
  allowDuplicateCheckIns: boolean;
  requireTermsAcceptance: boolean;
  autoRedirectDelay: number;
  maxSearchResults: number;
  sessionTimeoutMinutes: number;
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    termsAndConditions: '',
    question1Options: [],
    question3Options1: [],
    question3Options2: []
  });
  const [originalSettings, setOriginalSettings] = useState<AdminSettings | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    allowDuplicateCheckIns: false,
    requireTermsAcceptance: true,
    autoRedirectDelay: 5,
    maxSearchResults: 10,
    sessionTimeoutMinutes: 60
  });
  const [originalSystemConfig, setOriginalSystemConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Check if there are unsaved changes
    if (originalSettings && originalSystemConfig) {
      const settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      const configChanged = JSON.stringify(systemConfig) !== JSON.stringify(originalSystemConfig);
      setHasChanges(settingsChanged || configChanged);
    }
  }, [settings, originalSettings, systemConfig, originalSystemConfig]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminSettingsApi.get();
      setSettings(data);
      setOriginalSettings(data);
      
      // Initialize system config with defaults (in a real app, this would come from the API)
      setOriginalSystemConfig(systemConfig);
      setSystemConfig(systemConfig);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updatedSettings = await adminSettingsApi.update(settings);
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings);
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await adminSettingsApi.reset();
      await loadSettings(); // Reload the settings
      setSuccessMessage('Settings reset to defaults successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to reset settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    if (originalSettings) {
      setSettings({ ...originalSettings });
    }
    if (originalSystemConfig) {
      setSystemConfig({ ...originalSystemConfig });
    }
  };

  const handleTermsChange = (value: string) => {
    setSettings(prev => ({ ...prev, termsAndConditions: value }));
  };

  const handleQuestion1OptionsChange = (options: string[]) => {
    setSettings(prev => ({ ...prev, question1Options: options }));
  };

  const handleQuestion3Options1Change = (options: string[]) => {
    setSettings(prev => ({ ...prev, question3Options1: options }));
  };

  const handleQuestion3Options2Change = (options: string[]) => {
    setSettings(prev => ({ ...prev, question3Options2: options }));
  };

  const addOption = (field: 'question1Options' | 'question3Options1' | 'question3Options2') => {
    const newOption = prompt('Enter new option:');
    if (newOption && newOption.trim()) {
      setSettings(prev => ({
        ...prev,
        [field]: [...prev[field], newOption.trim()]
      }));
    }
  };

  const removeOption = (field: 'question1Options' | 'question3Options1' | 'question3Options2', index: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const editOption = (field: 'question1Options' | 'question3Options1' | 'question3Options2', index: number) => {
    const currentValue = settings[field][index];
    const newValue = prompt('Edit option:', currentValue);
    if (newValue !== null && newValue.trim()) {
      setSettings(prev => ({
        ...prev,
        [field]: prev[field].map((option, i) => i === index ? newValue.trim() : option)
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            System Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure terms & conditions and check-in questions
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          {hasChanges && (
            <button
              onClick={discardChanges}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={resetSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="text-green-800">{successMessage}</div>
        </div>
      )}

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="text-yellow-800">You have unsaved changes. Don't forget to save!</div>
        </div>
      )}

      <div className="space-y-6">
        {/* System Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            System Configuration
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Configure general system behavior and security settings.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allow Duplicate Check-ins */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Duplicate Check-ins
                </label>
                <p className="text-xs text-gray-500">
                  Allow workers to check in multiple times to the same event
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.allowDuplicateCheckIns}
                  onChange={(e) => setSystemConfig(prev => ({ ...prev, allowDuplicateCheckIns: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Require Terms Acceptance */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Require Terms Acceptance
                </label>
                <p className="text-xs text-gray-500">
                  Workers must accept terms and conditions to check in
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.requireTermsAcceptance}
                  onChange={(e) => setSystemConfig(prev => ({ ...prev, requireTermsAcceptance: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Auto Redirect Delay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Redirect Delay (seconds)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How long to show success message before redirecting
              </p>
              <input
                type="number"
                min="1"
                max="30"
                value={systemConfig.autoRedirectDelay}
                onChange={(e) => setSystemConfig(prev => ({ ...prev, autoRedirectDelay: parseInt(e.target.value) || 5 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Max Search Results */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Search Results
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Maximum number of workers to show in search results
              </p>
              <input
                type="number"
                min="5"
                max="50"
                value={systemConfig.maxSearchResults}
                onChange={(e) => setSystemConfig(prev => ({ ...prev, maxSearchResults: parseInt(e.target.value) || 10 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Session Timeout */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Session Timeout (minutes)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How long admin sessions stay active without activity
              </p>
              <input
                type="number"
                min="15"
                max="480"
                value={systemConfig.sessionTimeoutMinutes}
                onChange={(e) => setSystemConfig(prev => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) || 60 }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Terms and Conditions
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This text will be displayed to workers during the check-in process. Use the rich text editor or HTML mode.
          </p>
          <RichTextEditor
            value={settings.termsAndConditions}
            onChange={handleTermsChange}
          />
        </div>

        {/* Question 1 Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Question 1: "How did you hear about this event?"
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure the multiple choice options for the first check-in question.
          </p>
          <div className="space-y-2">
            {settings.question1Options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...settings.question1Options];
                    newOptions[index] = e.target.value;
                    handleQuestion1OptionsChange(newOptions);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => editOption('question1Options', index)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeOption('question1Options', index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption('question1Options')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Option
            </button>
          </div>
        </div>

        {/* Question 3 Part 1 Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Question 3a: "What is your primary interest in this event?"
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure the multiple choice options for the first part of question 3.
          </p>
          <div className="space-y-2">
            {settings.question3Options1.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...settings.question3Options1];
                    newOptions[index] = e.target.value;
                    handleQuestion3Options1Change(newOptions);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => editOption('question3Options1', index)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeOption('question3Options1', index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption('question3Options1')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Option
            </button>
          </div>
        </div>

        {/* Question 3 Part 2 Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Question 3b: "How would you rate your experience level?"
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure the multiple choice options for the second part of question 3.
          </p>
          <div className="space-y-2">
            {settings.question3Options2.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...settings.question3Options2];
                    newOptions[index] = e.target.value;
                    handleQuestion3Options2Change(newOptions);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => editOption('question3Options2', index)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeOption('question3Options2', index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption('question3Options2')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Option
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rich Text Editor Component
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [htmlValue, setHtmlValue] = useState(value);

  useEffect(() => {
    setHtmlValue(value);
  }, [value]);

  const handleHtmlChange = (newValue: string) => {
    setHtmlValue(newValue);
    onChange(newValue);
  };

  const insertTag = (tag: string, hasClosing: boolean = true) => {
    const textarea = document.getElementById('terms-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlValue.substring(start, end);
    
    let newText;
    if (hasClosing) {
      newText = htmlValue.substring(0, start) + 
                `<${tag}>${selectedText}</${tag}>` + 
                htmlValue.substring(end);
    } else {
      newText = htmlValue.substring(0, start) + 
                `<${tag}>` + 
                htmlValue.substring(start);
    }
    
    handleHtmlChange(newText);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tag.length + 2 + (hasClosing ? selectedText.length : 0);
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatButtons = [
    { label: 'H2', action: () => insertTag('h2'), tooltip: 'Heading 2' },
    { label: 'H3', action: () => insertTag('h3'), tooltip: 'Heading 3' },
    { label: 'B', action: () => insertTag('strong'), tooltip: 'Bold', className: 'font-bold' },
    { label: 'I', action: () => insertTag('em'), tooltip: 'Italic', className: 'italic' },
    { label: 'P', action: () => insertTag('p'), tooltip: 'Paragraph' },
    { label: 'UL', action: () => insertTag('ul'), tooltip: 'Unordered List' },
    { label: 'LI', action: () => insertTag('li'), tooltip: 'List Item' },
    { label: 'BR', action: () => insertTag('br', false), tooltip: 'Line Break' },
  ];

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {formatButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.action}
                title={button.tooltip}
                className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${button.className || ''}`}
              >
                {button.label}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'visual' ? 'html' : 'visual')}
              className={`px-3 py-1 text-xs rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                mode === 'html' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {mode === 'html' ? 'Visual' : 'HTML'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="p-3">
        {mode === 'visual' ? (
          <div className="space-y-4">
            <div 
              className="min-h-64 p-4 border border-gray-200 rounded bg-white prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlValue || '<p>Start typing your terms and conditions...</p>' }}
            />
            <div className="text-xs text-gray-500">
              Switch to HTML mode to edit the raw HTML, or use the toolbar buttons above to format text.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              id="terms-textarea"
              value={htmlValue}
              onChange={(e) => handleHtmlChange(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter HTML for terms and conditions..."
            />
            <div className="text-xs text-gray-500">
              You can use HTML tags like &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, etc.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};