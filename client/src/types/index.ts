// Shared types for the frontend application
export interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  workerId: number;
  eventId: number;
  question1Response: string;
  question2Response: boolean;
  question3Response1: string;
  question3Response2: string;
  termsAccepted: boolean;
}

export interface CheckIn extends CheckInRequest {
  id: number;
  timestamp: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface AdminSettings {
  termsAndConditions: string;
  question1Options: string[];
  question3Options1: string[];
  question3Options2: string[];
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}