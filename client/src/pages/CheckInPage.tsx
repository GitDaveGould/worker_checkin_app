import React, { useState, useEffect, Suspense, lazy } from 'react';
import { CheckInLanding } from '../components/CheckInLanding';
import { WorkerSearch } from '../components/WorkerSearch';
import { WorkerProfile } from '../components/WorkerProfile';
import { WorkerSearchResult, Worker, Event, CheckInRequest } from '../types';
import { eventApi, checkInApi, ApiError } from '../utils/api';

// LAZY LOAD HEAVY COMPONENTS FOR SAVAGE PERFORMANCE!!! 🚀🚀🚀
const NewWorkerForm = lazy(() => import('../components/NewWorkerForm').then(m => ({ default: m.NewWorkerForm })));
const CheckInQuestions = lazy(() => import('../components/CheckInQuestions').then(m => ({ default: m.CheckInQuestions })));
const TermsAndConditions = lazy(() => import('../components/TermsAndConditions').then(m => ({ default: m.TermsAndConditions })));
const CheckInSuccess = lazy(() => import('../components/CheckInSuccess').then(m => ({ default: m.CheckInSuccess })));
const DuplicateCheckIn = lazy(() => import('../components/DuplicateCheckIn').then(m => ({ default: m.DuplicateCheckIn })));

// LOADING COMPONENT FOR SMOOTH UX!!! ⚡
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
    <span className="text-gray-600">Loading...</span>
  </div>
);

type CheckInStep = 'landing' | 'search' | 'profile' | 'register' | 'questions' | 'terms' | 'success' | 'duplicate';

interface QuestionResponses {
  question1Response: string;
  question2Response: boolean;
  question3Response1: string;
  question3Response2: string;
}

export const CheckInPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<CheckInStep>('landing');
  const [selectedWorker, setSelectedWorker] = useState<WorkerSearchResult | Worker | null>(null);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponses | null>(null);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  useEffect(() => {
    const loadActiveEvents = async () => {
      try {
        const activeEvent = await eventApi.getActive();
        
        if (activeEvent) {
          // Single active event
          setActiveEvents([activeEvent]);
          setSelectedEvent(activeEvent);
        } else {
          // No active events
          setActiveEvents([]);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          setEventError(error.message);
        } else {
          setEventError('Failed to load active events. Please refresh the page.');
        }
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadActiveEvents();
  }, []);

  const handleReturningWorkerClick = () => {
    setCurrentStep('search');
  };

  const handleNewWorkerClickFromLanding = () => {
    setCurrentStep('register');
  };

  const handleWorkerSelect = (worker: WorkerSearchResult) => {
    setSelectedWorker(worker);
    setCurrentStep('profile');
  };

  const handleNewWorkerClick = () => {
    setCurrentStep('register');
  };

  const handleWorkerCreated = (worker: Worker) => {
    setSelectedWorker(worker);
    setCurrentStep('questions');
  };

  const handleProfileConfirm = () => {
    setCurrentStep('questions');
  };

  const handleProfileEdit = () => {
    setSelectedWorker(null);
    setCurrentStep('search');
  };

  const handleQuestionsComplete = (responses: QuestionResponses) => {
    setQuestionResponses(responses);
    setCurrentStep('terms');
  };

  const handleTermsAccept = async () => {
    if (!selectedWorker || !selectedEvent || !questionResponses) {
      setCheckInError('Missing required information. Please start over.');
      return;
    }

    setIsSubmittingCheckIn(true);
    setCheckInError(null);

    try {
      // First check for duplicate check-in
      const duplicateCheck = await checkInApi.checkDuplicate(selectedWorker.id, selectedEvent.id);
      
      if (duplicateCheck.hasCheckedIn) {
        setCurrentStep('duplicate');
        return;
      }

      // Create the check-in
      const checkInData: CheckInRequest = {
        workerId: selectedWorker.id,
        eventId: selectedEvent.id,
        ...questionResponses,
        termsAccepted: true
      };

      const result = await checkInApi.create(checkInData);
      setCheckInResult(result);
      setCurrentStep('success');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'DUPLICATE_CHECKIN') {
          setCurrentStep('duplicate');
        } else {
          setCheckInError(error.message);
        }
      } else {
        setCheckInError('Check-in failed. Please try again.');
      }
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleTermsDecline = () => {
    setCurrentStep('questions');
  };

  const handleBackToSearch = () => {
    setSelectedWorker(null);
    setQuestionResponses(null);
    setCheckInResult(null);
    setCheckInError(null);
    setCurrentStep('search');
  };

  const handleBackToLanding = () => {
    setSelectedWorker(null);
    setQuestionResponses(null);
    setCheckInResult(null);
    setCheckInError(null);
    setCurrentStep('landing');
  };

  const handleBackToProfile = () => {
    setCurrentStep('profile');
  };



  const handleCancelRegistration = () => {
    setCurrentStep('landing');
  };

  const handleCheckInComplete = () => {
    // Reset all state and return to landing
    setSelectedWorker(null);
    setQuestionResponses(null);
    setCheckInResult(null);
    setCheckInError(null);
    setCurrentStep('landing');
  };

  const handleDuplicateSelectDifferent = () => {
    setSelectedWorker(null);
    setCurrentStep('landing');
  };

  const handleDuplicateTryAgain = () => {
    setCurrentStep('landing');
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  if (isLoadingEvents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full mx-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full mx-4">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{eventError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full mx-4">
          <div className="text-center py-8">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Events</h2>
            <p className="text-gray-600">
              There are currently no active events available for check-in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8 safe-area-padding">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Worker Check-In System
          </h1>
          {selectedEvent && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-1">
                {selectedEvent.name}
              </h2>
              <p className="text-blue-700 text-sm sm:text-base">
                {selectedEvent.location}
              </p>
              <p className="text-xs sm:text-sm text-blue-600 mt-1">
                {new Date(selectedEvent.startDate).toLocaleDateString()} - {new Date(selectedEvent.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Event Selection (if multiple events) */}
        {activeEvents.length > 1 && !selectedEvent && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Select Event
              </h2>
              <div className="space-y-3">
                {activeEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="font-semibold text-gray-900">{event.name}</div>
                    <div className="text-gray-600">{event.location}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {selectedEvent && (
          <div className="max-w-2xl mx-auto px-2 sm:px-0">
            {currentStep === 'landing' && (
              <CheckInLanding
                onReturningWorkerClick={handleReturningWorkerClick}
                onNewWorkerClick={handleNewWorkerClickFromLanding}
              />
            )}

            {currentStep === 'search' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={handleBackToLanding}
                    className="text-blue-600 hover:text-blue-800 underline text-lg"
                  >
                    ← Back to Options
                  </button>
                </div>
                <WorkerSearch
                  onWorkerSelect={handleWorkerSelect}
                  onNewWorkerClick={handleNewWorkerClick}
                />
              </div>
            )}

            {currentStep === 'profile' && selectedWorker && (
              <WorkerProfile
                worker={selectedWorker as WorkerSearchResult}
                onEdit={handleProfileEdit}
                onConfirm={handleProfileConfirm}
              />
            )}

            {currentStep === 'register' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={handleBackToLanding}
                    className="text-blue-600 hover:text-blue-800 underline text-lg"
                  >
                    ← Back to Options
                  </button>
                </div>
                <Suspense fallback={<ComponentLoader />}>
                  <NewWorkerForm
                    onWorkerCreated={handleWorkerCreated}
                    onCancel={handleCancelRegistration}
                  />
                </Suspense>
              </div>
            )}

            {currentStep === 'questions' && selectedWorker && (
              <Suspense fallback={<ComponentLoader />}>
                <CheckInQuestions
                  onComplete={handleQuestionsComplete}
                  onBack={currentStep === 'questions' && selectedWorker && 'id' in selectedWorker ? handleBackToProfile : handleBackToSearch}
                />
              </Suspense>
            )}

            {currentStep === 'terms' && (
              <div>
                {checkInError && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {checkInError}
                  </div>
                )}
                <Suspense fallback={<ComponentLoader />}>
                  <TermsAndConditions
                    onAccept={handleTermsAccept}
                    onDecline={handleTermsDecline}
                  />
                </Suspense>
                {isSubmittingCheckIn && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Completing your check-in...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'success' && checkInResult && (
              <Suspense fallback={<ComponentLoader />}>
                <CheckInSuccess
                  worker={checkInResult.worker}
                  event={checkInResult.event}
                  checkInTime={checkInResult.checkIn.timestamp}
                  onComplete={handleCheckInComplete}
                  autoRedirectSeconds={5}
                />
              </Suspense>
            )}

            {currentStep === 'duplicate' && selectedWorker && selectedEvent && (
              <Suspense fallback={<ComponentLoader />}>
                <DuplicateCheckIn
                  worker={selectedWorker as WorkerSearchResult}
                  event={selectedEvent}
                  onTryAgain={handleDuplicateTryAgain}
                  onSelectDifferentWorker={handleDuplicateSelectDifferent}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Back to Event Selection */}
        {activeEvents.length > 1 && selectedEvent && (
          <div className="text-center mt-8">
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Event Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};