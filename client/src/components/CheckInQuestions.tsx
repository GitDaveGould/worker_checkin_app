import React, { useState, useEffect } from 'react';
import { AdminSettings, ValidationError } from '../types';
import { adminApi, ApiError } from '../utils/api';

interface CheckInQuestionsProps {
  onComplete: (responses: {
    question1Response: string;
    question2Response: boolean;
    question3Response1: string;
    question3Response2: string;
  }) => void;
  onBack: () => void;
  className?: string;
}

interface QuestionResponses {
  question1Response: string;
  question2Response: boolean | null;
  question3Response1: string;
  question3Response2: string;
}

const initialResponses: QuestionResponses = {
  question1Response: '',
  question2Response: null,
  question3Response1: '',
  question3Response2: ''
};

export const CheckInQuestions: React.FC<CheckInQuestionsProps> = ({
  onComplete,
  onBack,
  className = ''
}) => {
  const [responses, setResponses] = useState<QuestionResponses>(initialResponses);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const adminSettings = await adminApi.getSettings();
        setSettings(adminSettings);
      } catch (error) {
        if (error instanceof ApiError) {
          setLoadError(error.message);
        } else {
          setLoadError('Failed to load questions. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleQuestion1Change = (value: string) => {
    setResponses(prev => ({ ...prev, question1Response: value }));
    clearFieldError('question1Response');
  };

  const handleQuestion2Change = (value: boolean) => {
    setResponses(prev => ({ ...prev, question2Response: value }));
    clearFieldError('question2Response');
  };

  const handleQuestion3Part1Change = (value: string) => {
    setResponses(prev => ({ ...prev, question3Response1: value }));
    clearFieldError('question3Response1');
  };

  const handleQuestion3Part2Change = (value: string) => {
    setResponses(prev => ({ ...prev, question3Response2: value }));
    clearFieldError('question3Response2');
  };

  const validateResponses = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!responses.question1Response) {
      newErrors.push({ field: 'question1Response', message: 'Please select an answer for Question 1' });
    }

    if (responses.question2Response === null) {
      newErrors.push({ field: 'question2Response', message: 'Please select an answer for Question 2' });
    }

    if (!responses.question3Response1) {
      newErrors.push({ field: 'question3Response1', message: 'Please select an answer for Question 3 Part 1' });
    }

    if (!responses.question3Response2) {
      newErrors.push({ field: 'question3Response2', message: 'Please select an answer for Question 3 Part 2' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateResponses() && responses.question2Response !== null) {
      onComplete({
        question1Response: responses.question1Response,
        question2Response: responses.question2Response,
        question3Response1: responses.question3Response1,
        question3Response2: responses.question3Response2
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{loadError}</p>
          <button onClick={onBack} className="btn-secondary">
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
          Check-In Questions
        </h2>
        <p className="text-gray-600">
          Please answer all questions to complete your check-in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question 1 - Multiple Choice */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            1. How did you hear about this event?
          </label>
          <div className="space-y-3">
            {settings.question1Options.map((option, index) => (
              <label key={index} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question1"
                  value={option}
                  checked={responses.question1Response === option}
                  onChange={(e) => handleQuestion1Change(e.target.value)}
                  className="h-5 w-5 text-blue-600 mr-3"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
          {getFieldError('question1Response') && (
            <p className="mt-2 text-sm text-red-600">{getFieldError('question1Response')}</p>
          )}
        </div>

        {/* Question 2 - Yes/No */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            2. Is this your first time attending this type of event?
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="question2"
                value="true"
                checked={responses.question2Response === true}
                onChange={() => handleQuestion2Change(true)}
                className="h-5 w-5 text-blue-600 mr-3"
              />
              <span className="text-lg">Yes</span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="question2"
                value="false"
                checked={responses.question2Response === false}
                onChange={() => handleQuestion2Change(false)}
                className="h-5 w-5 text-blue-600 mr-3"
              />
              <span className="text-lg">No</span>
            </label>
          </div>
          {getFieldError('question2Response') && (
            <p className="mt-2 text-sm text-red-600">{getFieldError('question2Response')}</p>
          )}
        </div>

        {/* Question 3 Part 1 - Multiple Choice */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            3a. What is your primary interest in this event?
          </label>
          <div className="space-y-3">
            {settings.question3Options1.map((option, index) => (
              <label key={index} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question3part1"
                  value={option}
                  checked={responses.question3Response1 === option}
                  onChange={(e) => handleQuestion3Part1Change(e.target.value)}
                  className="h-5 w-5 text-blue-600 mr-3"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
          {getFieldError('question3Response1') && (
            <p className="mt-2 text-sm text-red-600">{getFieldError('question3Response1')}</p>
          )}
        </div>

        {/* Question 3 Part 2 - Multiple Choice */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            3b. How would you rate your experience level?
          </label>
          <div className="space-y-3">
            {settings.question3Options2.map((option, index) => (
              <label key={index} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question3part2"
                  value={option}
                  checked={responses.question3Response2 === option}
                  onChange={(e) => handleQuestion3Part2Change(e.target.value)}
                  className="h-5 w-5 text-blue-600 mr-3"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
          {getFieldError('question3Response2') && (
            <p className="mt-2 text-sm text-red-600">{getFieldError('question3Response2')}</p>
          )}
        </div>

        <div className="flex flex-col space-y-3 pt-6">
          <button
            type="submit"
            className="btn-primary w-full text-lg py-4"
          >
            Continue to Terms & Conditions
          </button>
          
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary w-full text-lg py-4"
          >
            Back to Worker Selection
          </button>
        </div>
      </form>
    </div>
  );
};