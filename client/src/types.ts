// Re-export types from shared directory
export * from '../../shared/types';

// Additional client-specific types
export interface ValidationError {
  field: string;
  message: string;
}