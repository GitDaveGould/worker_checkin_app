import React, { useEffect, useState } from 'react';
import { Worker, Event } from '../types';

interface CheckInSuccessProps {
  worker: Worker | { id: number; firstName: string; lastName: string; email: string };
  event: Event | { id: number; name: string; location: string };
  checkInTime: string;
  onComplete: () => void;
  autoRedirectSeconds?: number;
  className?: string;
}

export const CheckInSuccess: React.FC<CheckInSuccessProps> = ({
  worker,
  event,
  checkInTime,
  onComplete,
  autoRedirectSeconds = 5,
  className = ''
}) => {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`card ${className}`}>
      {/* Success Icon */}
      <div className="text-center mb-6">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-12 h-12 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-green-600 mb-2">
          Check-In Successful!
        </h2>
        
        <p className="text-lg text-gray-600">
          Thank you for checking in to the event
        </p>
      </div>

      {/* Check-in Details */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Check-In Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Worker
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {worker.firstName} {worker.lastName}
              </div>
              {'email' in worker && (
                <div className="text-sm text-gray-600">
                  {worker.email}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {event.name}
              </div>
              <div className="text-sm text-gray-600">
                {event.location}
              </div>
            </div>
          </div>

          <div className="border-t border-green-200 pt-4">
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-In Time
              </label>
              <div className="text-xl font-bold text-green-600">
                {formatTime(checkInTime)}
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(checkInTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-redirect Notice */}
      <div className="text-center mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 mb-2">
            Returning to home screen in <span className="font-bold text-xl">{countdown}</span> seconds
          </p>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((autoRedirectSeconds - countdown) / autoRedirectSeconds) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Manual Actions */}
      <div className="flex flex-col space-y-3">
        <button
          onClick={onComplete}
          className="btn-primary w-full text-lg py-4"
        >
          Return to Home Screen Now
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Your check-in has been recorded successfully
          </p>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-2">
            What's Next?
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Please proceed to the event location</li>
            <li>• Keep your confirmation for your records</li>
            <li>• Enjoy the event!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};