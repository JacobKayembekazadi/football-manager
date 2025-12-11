/**
 * Error Handler Tests
 * 
 * Tests for error handling utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  createAppError,
  isNetworkError,
  isSupabaseError,
  handleError,
} from '../../utils/errorHandler';

describe('errorHandler', () => {
  describe('getErrorMessage', () => {
    it('should return user-friendly message for network errors', () => {
      const error = new Error('Network error');
      expect(getErrorMessage(error)).toContain('Network error');
    });

    it('should return user-friendly message for API key errors', () => {
      const error = new Error('API key missing');
      expect(getErrorMessage(error)).toContain('API configuration');
    });

    it('should return user-friendly message for not found errors', () => {
      const error = new Error('not found');
      expect(getErrorMessage(error)).toContain('not found');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Some unexpected error that is very long and contains lots of technical details that users should not see');
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle non-Error objects', () => {
      expect(getErrorMessage('string error')).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('createAppError', () => {
    it('should create AppError from Error object', () => {
      const error = new Error('Test error');
      const appError = createAppError(error);

      expect(appError.message).toBe('Test error');
      expect(appError.userMessage).toBeDefined();
      expect(appError.details).toBe(error);
    });

    it('should handle non-Error objects', () => {
      const appError = createAppError('string error');
      expect(appError.message).toBe('string error');
    });
  });

  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      expect(isNetworkError(new Error('Network error'))).toBe(true);
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('fetch error'))).toBe(true);
      expect(isNetworkError(new Error('Other error'))).toBe(false);
    });
  });

  describe('isSupabaseError', () => {
    it('should detect Supabase errors', () => {
      expect(isSupabaseError(new Error('PGRST116'))).toBe(true);
      expect(isSupabaseError(new Error('RLS policy'))).toBe(true);
      expect(isSupabaseError(new Error('Supabase connection'))).toBe(true);
      expect(isSupabaseError(new Error('Other error'))).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should log and return user-friendly message', () => {
      const error = new Error('Test error');
      const message = handleError(error, 'test-context');
      
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    });
  });
});

