import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthContextType, User } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { Navigate } from 'react-router-dom';

const API_BASE_URL = 'https://localhost:7226';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate token and set user on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Set the token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Try to validate the token with a test request
          await api.get('/api/auth/validate-token');
          
          // If successful, set the user
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // If token is invalid, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'vendor' = 'vendor') => {
    setLoading(true);
    setError(null);
    
    try {
      // Make API call based on selected role
      const response = await api.post(
        role === 'admin' ? '/api/admin/login' : '/api/vendor/login',
        { email, password }
      );
      
      const data = response.data;
      
      // Create user object from API response
      const user: User = {
        id: data.id || email.split('@')[0],
        name: data.name || email.split('@')[0],
        email: email,
        role: role,
        verified: true
      };
      
      // Store token and user info
      const token = data.token || data.accessToken;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (e: any) {
      console.error('Login error:', e.response?.data);
      const errorMessage = e.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string, role: 'admin' | 'vendor') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(
        role === 'admin' ? '/api/auth/admin/google-login' : '/api/auth/vendor/google-login',
        { credential }
      );
      
      const data = response.data;
      
      const user: User = {
        id: data.id || data.email.split('@')[0],
        name: data.name || data.email.split('@')[0],
        email: data.email,
        role: role,
        verified: true
      };
      
      const token = data.token || data.accessToken;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (e: any) {
      console.error('Google login error:', e.response?.data);
      const errorMessage = e.response?.data?.message || 'Google login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const completeVendorRegistration = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get existing vendors or create new object
      const storedVendors = localStorage.getItem('verified_vendors');
      let verifiedVendors: Record<string, { password: string; name: string }> = {};
      
      if (storedVendors) {
        verifiedVendors = JSON.parse(storedVendors);
      }
      
      // Save vendor password
      verifiedVendors[email] = { 
        password, 
        name: email.split('@')[0] // Simple name extraction from email
      };
      
      localStorage.setItem('verified_vendors', JSON.stringify(verifiedVendors));
      
      // Create vendor user
      const vendorUser: User = {
        id: email.split('@')[0],
        name: verifiedVendors[email].name,
        email: email,
        role: 'vendor',
        verified: true
      };
      
      // Set as current user
      localStorage.setItem('user', JSON.stringify(vendorUser));
      setUser(vendorUser);
      
      toast.success('Registration completed successfully!');
    } catch (e) {
      setError((e as Error).message);
      toast.error('Registration failed: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    // Clear all auth-related state and storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // Force a clean reload of the app
    window.location.href = '/login';
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    completeVendorRegistration,
    handleGoogleLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
