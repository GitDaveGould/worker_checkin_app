import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { CheckIn } from '../../types';
import { adminCheckInApi, AdminApiError } from '../../utils/adminApi';

interface CheckInWithDetails extends CheckIn {
  workerName: string;
  workerEmail: string;
  eventName: string;
  eventLocation: string;
}

export const CheckInsPage: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckInWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCheckIns, setSelectedCheckIns] = useState<Set<number>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [question1Filter, setQuestion1Filter] = useState('');
  const [question2Filter, setQuestion2Filter] = useState('');
  const [termsFilter, setTermsFilter] = useState('');
  
  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checkInToDelete, setCheckInToDelete] = useState<CheckInWithDetails | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [checkInToEdit, setCheckInToEdit] = useState<CheckInWithDetails | null>(null);

  const loadCheckIns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminCheckInApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        question1Response: question1Filter || undefined,
        question2Response: question2Filter === 'true' ? true : question2Filter === 'false' ? false : undefined,
        termsAccepted: termsFilter === 'true' ? true : termsFilter === 'false' ? false : undefined,
        sortBy,
        sortOrder,
      });
      
      setCheckIns(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to load check-ins');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckIns();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, startDate, endDate, question1Filter, question2Filter, termsFilter]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleRowSelect = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedCheckIns);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCheckIns(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCheckIns(new Set(checkIns.map(c => c.id)));
    } else {
      setSelectedCheckIns(new Set());
    }
  };

  const handleDeleteCheckIn = async (checkIn: CheckInWithDetails) => {
    try {
      await adminCheckInApi.delete(checkIn.id);
      setShowDeleteModal(false);
      setCheckInToDelete(null);
      loadCheckIns();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete check-in');
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await adminCheckInApi.bulkDelete(Array.from(selectedCheckIns));
      setShowBulkDeleteModal(false);
      setSelectedCheckIns(new Set());
      loadCheckIns();
      
      if (result.errors && result.errors.length > 0) {
        setError(`Deleted ${result.deletedCount} check-ins, but encountered errors: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete check-ins');
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const columns: Column<CheckInWithDetails>[] = [
    {
      key: 'workerName',
      header: 'Worker',
      sortable: true,
      render: (_, checkIn) => (
        <div>
          <div className="font-medium text-gray-900">{checkIn.workerName}</div>
          <div className="text-sm text-gray-500">{checkIn.workerEmail}</div>
        </div>
      ),
    },
    {
      key: 'eventName',
      header: 'Event',
      sortable: true,
      render: (_, checkIn) => (
        <div>
          <div className="font-medium text-gray-900">{checkIn.eventName}</div>
          <div className="text-sm text-gray-500">{checkIn.eventLocation}</div>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Check-in Time',
      sortable: true,
      render: (value) => formatDateTime(value),
    },
    {
      key: 'question1Response',
      header: 'Q1 Response',
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value}</span>
      ),
    },
    {
      key: 'question2Response',
      header: 'Q2 Response',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'termsAccepted',
      header: 'Terms',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Accepted' : 'Not Accepted'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, checkIn) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setCheckInToEdit(checkIn);
              setShowEditModal(true);
            }}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setCheckInToDelete(checkIn);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:text-red-900 text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Check-ins
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {selectedCheckIns.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Selected ({selectedCheckIns.size})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="question1" className="block text-sm font-medium text-gray-700 mb-1">
              Q1 Response
            </label>
            <input
              type="text"
              id="question1"
              value={question1Filter}
              onChange={(e) => setQuestion1Filter(e.target.value)}
              placeholder="Filter by Q1 response"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="question2" className="block text-sm font-medium text-gray-700 mb-1">
              Q2 Response
            </label>
            <select
              id="question2"
              value={question2Filter}
              onChange={(e) => setQuestion2Filter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
              Terms Accepted
            </label>
            <select
              id="terms"
              value={termsFilter}
              onChange={(e) => setTermsFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Accepted</option>
              <option value="false">Not Accepted</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <DataTable
        data={checkIns}
        columns={columns}
        loading={loading}
        error={null}
        selectedRows={selectedCheckIns}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Delete Modal */}
      {showDeleteModal && checkInToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Check-in</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the check-in for {checkInToDelete.workerName} 
                  at {checkInToDelete.eventName}? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDeleteCheckIn(checkInToDelete)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCheckInToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Check-ins</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedCheckIns.size} selected check-ins? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && checkInToEdit && (
        <EditCheckInModal
          checkIn={checkInToEdit}
          onSave={async (updatedData) => {
            try {
              await adminCheckInApi.update(checkInToEdit.id, updatedData);
              setShowEditModal(false);
              setCheckInToEdit(null);
              loadCheckIns();
            } catch (err) {
              if (err instanceof AdminApiError) {
                setError(err.message);
              } else {
                setError('Failed to update check-in');
              }
            }
          }}
          onCancel={() => {
            setShowEditModal(false);
            setCheckInToEdit(null);
          }}
        />
      )}
    </div>
  );
};

// Edit Check-in Modal Component
interface EditCheckInModalProps {
  checkIn: CheckInWithDetails;
  onSave: (data: {
    question1Response?: string;
    question2Response?: boolean;
    question3Response1?: string;
    question3Response2?: string;
    termsAccepted?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

const EditCheckInModal: React.FC<EditCheckInModalProps> = ({ checkIn, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    question1Response: checkIn.question1Response || '',
    question2Response: checkIn.question2Response || false,
    question3Response1: checkIn.question3Response1 || '',
    question3Response2: checkIn.question3Response2 || '',
    termsAccepted: checkIn.termsAccepted || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Check-in</h3>
          
          {/* Worker and Event Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{checkIn.workerName}</div>
              <div className="text-gray-500">{checkIn.workerEmail}</div>
              <div className="text-gray-500 mt-1">{checkIn.eventName}</div>
              <div className="text-gray-400 text-xs">
                {new Date(checkIn.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question 1 Response */}
            <div>
              <label htmlFor="question1" className="block text-sm font-medium text-gray-700 mb-1">
                Question 1 Response
              </label>
              <input
                type="text"
                id="question1"
                value={formData.question1Response}
                onChange={(e) => setFormData({ ...formData, question1Response: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              />
            </div>

            {/* Question 2 Response */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question 2 Response
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="question2Response"
                    checked={formData.question2Response === true}
                    onChange={() => setFormData({ ...formData, question2Response: true })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={saving}
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="question2Response"
                    checked={formData.question2Response === false}
                    onChange={() => setFormData({ ...formData, question2Response: false })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={saving}
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Question 3 Response 1 */}
            <div>
              <label htmlFor="question3Response1" className="block text-sm font-medium text-gray-700 mb-1">
                Question 3 Response 1
              </label>
              <input
                type="text"
                id="question3Response1"
                value={formData.question3Response1}
                onChange={(e) => setFormData({ ...formData, question3Response1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              />
            </div>

            {/* Question 3 Response 2 */}
            <div>
              <label htmlFor="question3Response2" className="block text-sm font-medium text-gray-700 mb-1">
                Question 3 Response 2
              </label>
              <input
                type="text"
                id="question3Response2"
                value={formData.question3Response2}
                onChange={(e) => setFormData({ ...formData, question3Response2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              />
            </div>

            {/* Terms Accepted */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={saving}
                />
                <span className="ml-2 text-sm text-gray-700">Terms Accepted</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 flex items-center"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};