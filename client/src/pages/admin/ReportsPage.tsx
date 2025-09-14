import React, { useState, useEffect } from 'react';
import { adminCheckInApi, adminEventApi, AdminApiError } from '../../utils/adminApi';
import { Event } from '../../types';

interface ReportFilters {
  eventId: string;
  startDate: string;
  endDate: string;
  location: string;
}

interface CheckInAnalytics {
  question1Responses: Record<string, number>;
  question2Responses: { yes: number; no: number };
  question3Response1: Record<string, number>;
  question3Response2: Record<string, number>;
}

interface CheckInStats {
  totalCheckIns: number;
  todayCheckIns: number;
  thisWeekCheckIns: number;
  thisMonthCheckIns: number;
}

export const ReportsPage: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    eventId: '',
    startDate: '',
    endDate: '',
    location: ''
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<CheckInAnalytics | null>(null);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await adminEventApi.getAll({ limit: 100 });
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Properly handle eventId - only pass a number if it's a valid positive integer
      let eventId: number | undefined = undefined;
      if (filters.eventId && filters.eventId !== '') {
        const parsedEventId = Number(filters.eventId);
        if (!isNaN(parsedEventId) && parsedEventId > 0) {
          eventId = parsedEventId;
        }
      }

      // Load analytics and stats
      const [analyticsData, statsData] = await Promise.all([
        adminCheckInApi.getAnalytics(eventId),
        adminCheckInApi.getStats(eventId)
      ]);

      setAnalytics(analyticsData);
      setStats(statsData);

      // Load detailed check-in data for export
      const checkInsResponse = await adminCheckInApi.getAll({
        eventId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 1000 // Get more data for export
      });

      setReportData(checkInsResponse.data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to generate report');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    const headers = [
      'Check-in ID',
      'Worker Name',
      'Worker Email',
      'Event Name',
      'Event Location',
      'Check-in Time',
      'Question 1 Response',
      'Question 2 Response',
      'Question 3 Part 1',
      'Question 3 Part 2',
      'Terms Accepted'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.id,
        `"${row.workerName}"`,
        row.workerEmail,
        `"${row.eventName}"`,
        `"${row.eventLocation}"`,
        new Date(row.timestamp).toLocaleString(),
        `"${row.question1Response}"`,
        row.question2Response ? 'Yes' : 'No',
        `"${row.question3Response1}"`,
        `"${row.question3Response2}"`,
        row.termsAccepted ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `check-ins-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    // Create Excel-compatible HTML table
    const headers = [
      'Check-in ID',
      'Worker Name', 
      'Worker Email',
      'Event Name',
      'Event Location',
      'Check-in Time',
      'Question 1 Response',
      'Question 2 Response',
      'Question 3 Part 1',
      'Question 3 Part 2',
      'Terms Accepted'
    ];

    const excelContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Check-ins Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${reportData.length}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${reportData.map(row => `
                <tr>
                  <td>${row.id}</td>
                  <td>${row.workerName}</td>
                  <td>${row.workerEmail}</td>
                  <td>${row.eventName}</td>
                  <td>${row.eventLocation}</td>
                  <td>${new Date(row.timestamp).toLocaleString()}</td>
                  <td>${row.question1Response}</td>
                  <td>${row.question2Response ? 'Yes' : 'No'}</td>
                  <td>${row.question3Response1}</td>
                  <td>${row.question3Response2}</td>
                  <td>${row.termsAccepted ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `check-ins-report-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (reportData.length === 0) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    const jsonContent = JSON.stringify({
      generatedAt: new Date().toISOString(),
      filters,
      stats,
      analytics,
      checkIns: reportData
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `check-ins-report-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      eventId: '',
      startDate: '',
      endDate: '',
      location: ''
    });
    setAnalytics(null);
    setStats(null);
    setReportData([]);
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Reports & Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Generate detailed reports and analyze check-in data
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
              Event
            </label>
            <select
              id="event"
              value={filters.eventId}
              onChange={(e) => handleFilterChange('eventId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {event.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
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
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="Filter by location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>

          {reportData.length > 0 && (
            <>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export CSV
              </button>
              
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export Excel
              </button>
              
              <button
                onClick={exportToJSON}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Check-ins</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalCheckIns.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.todayCheckIns.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.thisWeekCheckIns.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.thisMonthCheckIns.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question 1 Analytics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Question 1: How did you hear about this event?
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.question1Responses).map(([response, count]) => (
                <div key={response} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{response}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.question1Responses))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question 2 Analytics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Question 2: First time attending?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Yes</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(analytics.question2Responses.yes / (analytics.question2Responses.yes + analytics.question2Responses.no)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{analytics.question2Responses.yes}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">No</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(analytics.question2Responses.no / (analytics.question2Responses.yes + analytics.question2Responses.no)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{analytics.question2Responses.no}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question 3 Part 1 Analytics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Question 3a: Primary interest
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.question3Response1).map(([response, count]) => (
                <div key={response} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{response}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.question3Response1))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question 3 Part 2 Analytics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Question 3b: Experience level
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.question3Response2).map(([response, count]) => (
                <div key={response} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{response}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.question3Response2))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Summary */}
      {reportData.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Report Summary
          </h3>
          <div className="text-sm text-gray-600">
            <p>Generated {reportData.length} check-in records</p>
            <p>Filters applied: {Object.entries(filters).filter(([_, value]) => value).length > 0 ? 
              Object.entries(filters)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ') 
              : 'None'
            }</p>
            <p>Generated at: {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};