import React from 'react';
import { WorkerSearchResult } from '../types';

interface WorkerProfileProps {
  worker: WorkerSearchResult;
  onEdit: () => void;
  onConfirm: () => void;
  className?: string;
}

export const WorkerProfile: React.FC<WorkerProfileProps> = ({
  worker,
  onEdit,
  onConfirm,
  className = ''
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Worker Profile
        </h2>
        <p className="text-gray-600">
          Please confirm this is the correct worker
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {worker.firstName} {worker.lastName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="text-lg text-gray-900">
              {worker.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <div className="text-lg text-gray-900">
              {worker.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        <button
          onClick={onConfirm}
          className="btn-primary w-full text-lg py-4"
        >
          This is Correct - Continue Check-In
        </button>
        
        <button
          onClick={onEdit}
          className="btn-secondary w-full text-lg py-4"
        >
          Search for Different Worker
        </button>
      </div>
    </div>
  );
};