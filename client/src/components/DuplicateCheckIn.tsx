import React from 'react';
import { WorkerSearchResult, Event } from '../types';

interface DuplicateCheckInProps {
  worker: WorkerSearchResult;
  event: Event | { id: number; name: string; location: string };
  onTryAgain: () => void;
  onSelectDifferentWorker: () => void;
  className?: string;
}

export const DuplicateCheckIn: React.FC<DuplicateCheckInProps> = ({
  worker,
  event,
  onTryAgain,
  onSelectDifferentWorker,
  className = ''
}) => {
  return (
    <div className={`card ${className}`}>
      {/* Warning Icon */}
      <div className="text-center mb-6">
        <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="w-12 h-12 text-yellow-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-yellow-600 mb-2">
          Already Checked In
        </h2>
        
        <p className="text-lg text-gray-600">
          This worker has already checked in to this event
        </p>
      </div>

      {/* Details */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {worker.firstName} {worker.lastName}
            </div>
            <div className="text-sm text-gray-600">
              {worker.email} • {worker.phone}
            </div>
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
      </div>

      {/* Information Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <svg 
            className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              Why am I seeing this message?
            </h3>
            <p className="text-sm text-blue-800">
              Our system prevents duplicate check-ins to ensure accurate attendance records. 
              Each worker can only check in once per event.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        <button
          onClick={onSelectDifferentWorker}
          className="btn-primary w-full text-lg py-4"
        >
          Select Different Worker
        </button>
        
        <button
          onClick={onTryAgain}
          className="btn-secondary w-full text-lg py-4"
        >
          Try Again
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-2">
            Need Help?
          </h4>
          <p className="text-sm text-gray-600">
            If you believe this is an error, please contact an event administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};