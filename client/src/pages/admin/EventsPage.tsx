import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/admin/DataTable';
import { Pagination } from '../../components/admin/Pagination';
import { Event } from '../../types';
import { adminEventApi, AdminApiError } from '../../utils/adminApi';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminEventApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        location: locationFilter || undefined,
        isActive: activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        sortBy,
        sortOrder,
      });
      
      setEvents(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to load events');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchTerm, locationFilter, activeFilter, startDateFilter, endDateFilter]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleRowSelect = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedEvents);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEvents(new Set(events.map(e => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      await adminEventApi.delete(event.id);
      setShowDeleteModal(false);
      setEventToDelete(null);
      loadEvents();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete event');
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await adminEventApi.bulkDelete(Array.from(selectedEvents));
      setShowBulkDeleteModal(false);
      setSelectedEvents(new Set());
      loadEvents();
      
      if (result.errors && result.errors.length > 0) {
        setError(`Deleted ${result.deletedCount} events, but encountered errors: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete events');
      }
    }
  };

  const handleSetActive = async (event: Event) => {
    try {
      await adminEventApi.setActiveEvent(event.id);
      loadEvents();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to set active event');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const isEventActive = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return now >= start && now <= end;
  };

  const columns: Column<Event>[] = [
    {
      key: 'name',
      header: 'Event Name',
      sortable: true,
      render: (_, event) => (
        <div>
          <div className="font-medium text-gray-900">{event.name}</div>
          <div className="text-sm text-gray-500">{event.location}</div>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Date Range',
      sortable: true,
      render: (_, event) => (
        <div>
          <div className="text-sm text-gray-900">
            {formatDateRange(event.startDate, event.endDate)}
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (_, event) => {
        const active = isEventActive(event);
        return (
          <div className="flex flex-col space-y-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {active ? 'Active' : 'Inactive'}
            </span>
            {event.isActive && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Featured
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, event) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEventToEdit(event);
              setShowEditModal(true);
            }}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            Edit
          </button>
          {!event.isActive && (
            <button
              onClick={() => handleSetActive(event)}
              className="text-green-600 hover:text-green-900 text-sm"
            >
              Set Active
            </button>
          )}
          <button
            onClick={() => {
              setEventToDelete(event);
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
            Events
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Import JSON
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Event
          </button>
          {selectedEvents.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Selected ({selectedEvents.size})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="active"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
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
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <DataTable
        data={events}
        columns={columns}
        loading={loading}
        error={null}
        selectedRows={selectedEvents}
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

      {/* Create/Edit Event Modal */}
      {(showCreateModal || showEditModal) && (
        <EventFormModal
          event={eventToEdit}
          onSave={async (eventData) => {
            try {
              if (eventToEdit) {
                // Update existing event
                await adminEventApi.update(eventToEdit.id, eventData);
              } else {
                // Create new event
                await adminEventApi.create(eventData as Omit<Event, 'id' | 'createdAt' | 'updatedAt'>);
              }
              setShowCreateModal(false);
              setShowEditModal(false);
              setEventToEdit(null);
              loadEvents();
            } catch (err) {
              if (err instanceof AdminApiError) {
                setError(err.message);
              } else {
                setError(eventToEdit ? 'Failed to update event' : 'Failed to create event');
              }
            }
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEventToEdit(null);
          }}
        />
      )}

      {/* JSON Import Modal */}
      {showImportModal && (
        <JsonImportModal
          onImport={async (jsonData) => {
            try {
              const result = await adminEventApi.importFromJson(jsonData);
              setShowImportModal(false);
              loadEvents();
              
              if (result.errors && result.errors.length > 0) {
                setError(`Imported ${result.imported} events, but encountered errors: ${result.errors.join(', ')}`);
              } else {
                // Show success message briefly
                setError(null);
              }
            } catch (err) {
              if (err instanceof AdminApiError) {
                setError(err.message);
              } else {
                setError('Failed to import events');
              }
            }
          }}
          onCancel={() => setShowImportModal(false)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && eventToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Event</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{eventToDelete.name}"? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDeleteEvent(eventToDelete)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
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
              <h3 className="text-lg font-medium text-gray-900">Delete Events</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedEvents.size} selected events? 
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
    </div>
  );
};

// Event Form Modal Component
interface EventFormModalProps {
  event: Event | null;
  onSave: (data: Partial<Event>) => Promise<void>;
  onCancel: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ event, onSave, onCancel }) => {
  const isEditing = event !== null;
  const [formData, setFormData] = useState({
    name: event?.name || '',
    location: event?.location || '',
    startDate: event?.startDate ? event.startDate.split('T')[0] : '',
    endDate: event?.endDate ? event.endDate.split('T')[0] : '',
    isActive: event?.isActive || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Event name is required';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Name */}
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={saving}
                placeholder="Enter event name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={saving}
                placeholder="Enter event location"
              />
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                />
                {validationErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                />
                {validationErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* Featured Event */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={saving}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Set as featured event (overrides date-based active status)
                </span>
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
                {saving ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// JSON Import Modal Component
interface JsonImportModalProps {
  onImport: (jsonData: any[]) => Promise<void>;
  onCancel: () => void;
}

const JsonImportModal: React.FC<JsonImportModalProps> = ({ onImport, onCancel }) => {
  const [jsonText, setJsonText] = useState('');
  const [, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateJsonData = (data: any[]): string[] => {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('JSON must be an array of events');
      return errors;
    }

    data.forEach((event, index) => {
      if (!event.name || typeof event.name !== 'string') {
        errors.push(`Event ${index + 1}: Name is required and must be a string`);
      }

      if (!event.location || typeof event.location !== 'string') {
        errors.push(`Event ${index + 1}: Location is required and must be a string`);
      }

      if (!event.startDate) {
        errors.push(`Event ${index + 1}: Start date is required`);
      } else {
        const startDate = new Date(event.startDate);
        if (isNaN(startDate.getTime())) {
          errors.push(`Event ${index + 1}: Invalid start date format`);
        }
      }

      if (!event.endDate) {
        errors.push(`Event ${index + 1}: End date is required`);
      } else {
        const endDate = new Date(event.endDate);
        if (isNaN(endDate.getTime())) {
          errors.push(`Event ${index + 1}: Invalid end date format`);
        }

        if (event.startDate && endDate < new Date(event.startDate)) {
          errors.push(`Event ${index + 1}: End date must be after start date`);
        }
      }
    });

    return errors;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setError('Please provide JSON data or upload a file');
      return;
    }

    setImporting(true);
    setError(null);
    setValidationErrors([]);

    try {
      const jsonData = JSON.parse(jsonText);
      const errors = validateJsonData(jsonData);

      if (errors.length > 0) {
        setValidationErrors(errors);
        setImporting(false);
        return;
      }

      await onImport(jsonData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your JSON syntax.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to import events');
      }
    } finally {
      setImporting(false);
    }
  };

  const sampleJson = `[
  {
    "name": "Sample Event 1",
    "location": "Conference Center A",
    "startDate": "2024-03-15",
    "endDate": "2024-03-15",
    "isActive": false
  },
  {
    "name": "Sample Event 2",
    "location": "Meeting Room B",
    "startDate": "2024-03-20",
    "endDate": "2024-03-22",
    "isActive": true
  }
]`;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Events from JSON</h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-800 text-sm">
                <div className="font-medium mb-2">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700 mb-1">
                Upload JSON File
              </label>
              <input
                type="file"
                id="jsonFile"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={importing}
              />
            </div>

            <div className="text-center text-gray-500">or</div>

            {/* JSON Text Area */}
            <div>
              <label htmlFor="jsonText" className="block text-sm font-medium text-gray-700 mb-1">
                Paste JSON Data
              </label>
              <textarea
                id="jsonText"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                disabled={importing}
                placeholder="Paste your JSON data here..."
              />
            </div>

            {/* Sample JSON */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sample JSON Format
                </label>
                <button
                  type="button"
                  onClick={() => setJsonText(sampleJson)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  disabled={importing}
                >
                  Use Sample
                </button>
              </div>
              <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs overflow-x-auto">
                {sampleJson}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={importing}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !jsonText.trim()}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 flex items-center"
              >
                {importing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {importing ? 'Importing...' : 'Import Events'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};