import React, { useState, useEffect } from 'react';
import { WorkerSearchResult } from '../types';
import { workerApi, ApiError } from '../utils/api';
import { useDebounce } from '../hooks/useDebounce';

interface WorkerSearchProps {
  onWorkerSelect: (worker: WorkerSearchResult) => void;
  onNewWorkerClick: () => void;
  className?: string;
}

export const WorkerSearch: React.FC<WorkerSearchProps> = ({
  onWorkerSelect,
  onNewWorkerClick,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WorkerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await workerApi.search(debouncedSearchQuery);
        setSearchResults(response.results);
        setShowResults(true);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Search failed. Please try again.');
        }
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const handleWorkerSelect = (worker: WorkerSearchResult) => {
    setSearchQuery(`${worker.firstName} ${worker.lastName}`);
    setShowResults(false);
    onWorkerSelect(worker);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length < 3) {
      setShowResults(false);
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 && searchQuery.length >= 3) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="mb-4">
        <label htmlFor="worker-search" className="block text-lg font-medium text-gray-700 mb-2">
          Search for Worker
        </label>
        <input
          id="worker-search"
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Enter name, email, or phone number (min 3 characters)"
          className="input-field text-lg"
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-12 text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showResults && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((worker) => (
                <button
                  key={worker.id}
                  onClick={() => handleWorkerSelect(worker)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {worker.firstName} {worker.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {worker.email} • {worker.phone}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 px-4 text-center text-gray-500">
              No workers found matching your search.
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={onNewWorkerClick}
          className="btn-secondary w-full text-lg"
        >
          Register New Worker
        </button>
      </div>

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <div className="mt-2 text-sm text-gray-500">
          Enter at least 3 characters to search
        </div>
      )}
    </div>
  );
};