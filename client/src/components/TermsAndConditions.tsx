import React, { useState, useEffect } from 'react';
import { AdminSettings } from '../types';
import { adminApi, ApiError } from '../utils/api';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
  onAccept,
  onDecline,
  className = ''
}) => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const adminSettings = await adminApi.getSettings();
        setSettings(adminSettings);
      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to load terms and conditions. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleAcceptanceChange = (accepted: boolean) => {
    setHasAccepted(accepted);
  };

  const handleAccept = () => {
    if (hasAccepted) {
      onAccept();
    }
  };

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading terms and conditions...</p>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={onDecline} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Terms and Conditions
        </h2>
        <p className="text-gray-600">
          Please read and accept the terms and conditions to complete your check-in
        </p>
      </div>

      {/* Terms Content */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6 max-h-80 overflow-y-auto border">
        <div 
          className="prose prose-sm max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: settings.termsAndConditions }}
        />
      </div>

      {/* Acceptance Checkbox */}
      <div className="mb-6">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAccepted}
            onChange={(e) => handleAcceptanceChange(e.target.checked)}
            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-lg text-gray-900">
            I have read and agree to the terms and conditions above
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        <button
          onClick={handleAccept}
          disabled={!hasAccepted}
          className={`w-full text-lg py-4 rounded-lg font-medium transition-colors duration-200 ${
            hasAccepted
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasAccepted ? 'Accept and Complete Check-In' : 'Please Accept Terms to Continue'}
        </button>
        
        <button
          onClick={onDecline}
          className="btn-secondary w-full text-lg py-4"
        >
          Decline and Go Back
        </button>
      </div>

      {/* Legal Notice */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by these conditions.
      </div>
    </div>
  );
};