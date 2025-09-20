/**
 * useAuth hook tests
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/hooks/useAuth';
import { mockFirebaseAuth } from '../utils/testUtils';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getCurrentUser: jest.fn()
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should handle sign in successfully', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
      user: mockUser
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
  });

  it('should handle sign in error', async () => {
    const mockError = new Error('Invalid credentials');
    mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      'test@example.com',
      'wrongpassword'
    );
  });

  it('should handle sign up successfully', async () => {
    const mockUser = { uid: '123', email: 'newuser@example.com' };
    mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({
      user: mockUser
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      age: 16,
      monthlyAllowance: 100
    };

    await act(async () => {
      await result.current.signUp('newuser@example.com', 'password123', userData);
    });

    expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      'newuser@example.com',
      'password123'
    );
  });

  it('should handle sign up error', async () => {
    const mockError = new Error('Email already in use');
    mockFirebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      age: 16,
      monthlyAllowance: 100
    };

    await act(async () => {
      try {
        await result.current.signUp('existing@example.com', 'password123', userData);
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      'existing@example.com',
      'password123'
    );
  });

  it('should handle sign out successfully', async () => {
    mockFirebaseAuth.signOut.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
  });

  it('should handle sign out error', async () => {
    const mockError = new Error('Sign out failed');
    mockFirebaseAuth.signOut.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      try {
        await result.current.signOut();
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
  });

  it('should handle password reset successfully', async () => {
    mockFirebaseAuth.sendPasswordResetEmail.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com'
    );
  });

  it('should handle password reset error', async () => {
    const mockError = new Error('User not found');
    mockFirebaseAuth.sendPasswordResetEmail.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      try {
        await result.current.resetPassword('nonexistent@example.com');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
      'nonexistent@example.com'
    );
  });

  it('should update user state when auth state changes', () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    
    // Mock onAuthStateChanged to call callback with user
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('should set user to null when auth state changes to null', () => {
    // Mock onAuthStateChanged to call callback with null
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle loading state correctly', () => {
    // Mock onAuthStateChanged to not call callback immediately
    mockFirebaseAuth.onAuthStateChanged.mockImplementation(() => {
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.loading).toBe(true);
  });
});
