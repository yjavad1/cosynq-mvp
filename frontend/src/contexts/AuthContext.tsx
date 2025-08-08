import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@shared/types';
import { apiService } from '../services/api';
import { getErrorMessage } from '../utils/errorHandling';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresOnboarding: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; requiresOnboarding?: boolean } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_ONBOARDING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateOnboardingStatus: (requiresOnboarding: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        requiresOnboarding: action.payload.requiresOnboarding ?? false,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        requiresOnboarding: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_ONBOARDING':
      return {
        ...state,
        requiresOnboarding: action.payload,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  requiresOnboarding: false,
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('cosynq_token');
    
    if (!token) {
      dispatch({ type: 'AUTH_LOGOUT' });
      return;
    }

    try {
      const response = await apiService.getProfile();
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { 
          user: response.data.data.user, 
          requiresOnboarding: response.data.data.requiresOnboarding 
        } 
      });
    } catch (error) {
      localStorage.removeItem('cosynq_token');
      localStorage.removeItem('cosynq_refresh_token');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await apiService.login(credentials);
      
      if (response.data.success && response.data.data) {
        const { user, token, refreshToken, requiresOnboarding } = response.data.data;
        
        localStorage.setItem('cosynq_token', token);
        localStorage.setItem('cosynq_refresh_token', refreshToken);
        
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, requiresOnboarding: requiresOnboarding || false } 
        });
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await apiService.register(credentials);
      
      if (response.data.success && response.data.data) {
        const { user, token, refreshToken, requiresOnboarding } = response.data.data;
        
        localStorage.setItem('cosynq_token', token);
        localStorage.setItem('cosynq_refresh_token', refreshToken);
        
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, requiresOnboarding: requiresOnboarding || true } // New users require onboarding by default
        });
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('cosynq_token');
      localStorage.removeItem('cosynq_refresh_token');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateOnboardingStatus = (requiresOnboarding: boolean) => {
    dispatch({ type: 'UPDATE_ONBOARDING', payload: requiresOnboarding });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateOnboardingStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};