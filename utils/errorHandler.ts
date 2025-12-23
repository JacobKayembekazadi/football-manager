/**
 * Error Handler Utility
 * 
 * Centralized error handling for the application.
 */

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  userMessage: string;
}

/**
 * Convert an error to a user-friendly message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('API key')) {
      return 'API configuration error. Please check your settings.';
    }
    if (error.message.includes('not found') || error.message.includes('PGRST116')) {
      return 'The requested item was not found.';
    }
    if (error.message.includes('permission') || error.message.includes('RLS')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return 'This item already exists.';
    }
    
    // Return the error message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }
  
  // Generic fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Create an AppError from an unknown error
 */
export const createAppError = (error: unknown): AppError => {
  const message = error instanceof Error ? error.message : String(error);
  const code = error instanceof Error && 'code' in error ? String(error.code) : undefined;
  
  return {
    message,
    code,
    details: error,
    userMessage: getErrorMessage(error),
  };
};

/**
 * Log error for debugging
 */
export const logError = (error: AppError, context?: string): void => {
  const prefix = context ? `[${context}]` : '[Error]';
  console.error(`${prefix}`, {
    message: error.message,
    code: error.code,
    userMessage: error.userMessage,
    details: error.details,
  });
};

/**
 * Handle and display error to user
 */
export const handleError = (error: unknown, context?: string): string => {
  const appError = createAppError(error);
  logError(appError, context);
  return appError.userMessage;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('Network') || 
           error.message.includes('fetch') ||
           error.message.includes('Failed to fetch');
  }
  return false;
};

/**
 * Check if error is a Supabase error
 */
export const isSupabaseError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('PGRST') ||
           error.message.includes('RLS') ||
           error.message.includes('Supabase');
  }
  return false;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.message.includes('not found') || 
            error.message.includes('permission') ||
            error.message.includes('duplicate')) {
          throw error;
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};







