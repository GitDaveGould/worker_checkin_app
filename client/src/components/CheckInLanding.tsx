import React from 'react';

interface CheckInLandingProps {
  onReturningWorkerClick: () => void;
  onNewWorkerClick: () => void;
}

export const CheckInLanding: React.FC<CheckInLandingProps> = ({
  onReturningWorkerClick,
  onNewWorkerClick
}) => {
  return (
    <div className="card max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Welcome to Check-In
        </h2>
        <p className="text-gray-600 text-lg">
          Please select your check-in option below
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onReturningWorkerClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-lg text-xl transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <div className="flex items-center justify-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Returning Worker
          </div>
          <div className="text-blue-100 text-sm mt-2">
            I've checked in before
          </div>
        </button>

        <button
          onClick={onNewWorkerClick}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 px-8 rounded-lg text-xl transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          <div className="flex items-center justify-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            New Worker
          </div>
          <div className="text-green-100 text-sm mt-2">
            First time checking in
          </div>
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Need help? Contact event staff for assistance.
        </p>
      </div>
    </div>
  );
};