// Error handling utilities
interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message: string;
}

export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

export function createApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message || 'API request failed',
      status: error.response?.status,
      data: error.response?.data
    };
  }
  
  return {
    message: getErrorMessage(error)
  };
}