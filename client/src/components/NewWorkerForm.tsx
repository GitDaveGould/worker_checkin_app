import React, { useState } from 'react';
import { Worker, ValidationError } from '../types';
import { workerApi, ApiError } from '../utils/api';

interface NewWorkerFormProps {
  onWorkerCreated: (worker: Worker) => void;
  onCancel: () => void;
  className?: string;
}

interface WorkerFormData {
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
}

const initialFormData: WorkerFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States'
};

export const NewWorkerForm: React.FC<NewWorkerFormProps> = ({
  onWorkerCreated,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || email === formData.email) return;
    
    setEmailChecking(true);
    try {
      const result = await workerApi.checkEmail(email);
      if (!result.available) {
        setErrors(prev => [...prev.filter(e => e.field !== 'email'), {
          field: 'email',
          message: 'This email address is already registered'
        }]);
      }
    } catch (error) {
      // Ignore check errors, validation will catch it on submit
    } finally {
      setEmailChecking(false);
    }
  };

  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || phone === formData.phone) return;
    
    setPhoneChecking(true);
    try {
      const result = await workerApi.checkPhone(phone);
      if (!result.available) {
        setErrors(prev => [...prev.filter(e => e.field !== 'phone'), {
          field: 'phone',
          message: 'This phone number is already registered'
        }]);
      }
    } catch (error) {
      // Ignore check errors, validation will catch it on submit
    } finally {
      setPhoneChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    try {
      const worker = await workerApi.create(formData);
      onWorkerCreated(worker);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.field) {
          setErrors([{ field: error.field, message: error.message }]);
        } else {
          setErrors([{ field: 'general', message: error.message }]);
        }
      } else {
        setErrors([{ field: 'general', message: 'Registration failed. Please try again.' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generalError = getFieldError('general');

  return (
    <div className={`card ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Register New Worker
        </h2>
        <p className="text-gray-600">
          Please fill out all required information
        </p>
      </div>

      {generalError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`input-field ${getFieldError('firstName') ? 'border-red-500' : ''}`}
              required
            />
            {getFieldError('firstName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('firstName')}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`input-field ${getFieldError('lastName') ? 'border-red-500' : ''}`}
              required
            />
            {getFieldError('lastName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={`input-field ${getFieldError('dateOfBirth') ? 'border-red-500' : ''}`}
            required
          />
          {getFieldError('dateOfBirth') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('dateOfBirth')}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={(e) => checkEmailAvailability(e.target.value)}
              className={`input-field ${getFieldError('email') ? 'border-red-500' : ''}`}
              required
            />
            {emailChecking && (
              <div className="absolute right-3 top-3 text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={(e) => checkPhoneAvailability(e.target.value)}
              placeholder="(555) 123-4567"
              className={`input-field ${getFieldError('phone') ? 'border-red-500' : ''}`}
              required
            />
            {phoneChecking && (
              <div className="absolute right-3 top-3 text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
          )}
        </div>

        <div>
          <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleInputChange}
            className={`input-field ${getFieldError('streetAddress') ? 'border-red-500' : ''}`}
            required
          />
          {getFieldError('streetAddress') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('streetAddress')}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`input-field ${getFieldError('city') ? 'border-red-500' : ''}`}
              required
            />
            {getFieldError('city') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('city')}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className={`input-field ${getFieldError('state') ? 'border-red-500' : ''}`}
              required
            />
            {getFieldError('state') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('state')}</p>
            )}
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code *
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className={`input-field ${getFieldError('zipCode') ? 'border-red-500' : ''}`}
              required
            />
            {getFieldError('zipCode') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('zipCode')}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className={`input-field ${getFieldError('country') ? 'border-red-500' : ''}`}
            required
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="Mexico">Mexico</option>
          </select>
          {getFieldError('country') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('country')}</p>
          )}
        </div>

        <div className="flex flex-col space-y-3 pt-6">
          <button
            type="submit"
            disabled={isSubmitting || emailChecking || phoneChecking}
            className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Registering...' : 'Register Worker'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary w-full text-lg py-4 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};