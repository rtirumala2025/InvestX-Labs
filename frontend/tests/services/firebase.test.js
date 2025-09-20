/**
 * Firebase services tests
 */

import {
  signUp,
  signIn,
  signOut,
  resetPassword,
  createUserProfile,
  updateUserProfile,
  createPortfolio,
  addHolding,
  updateHolding,
  saveSuggestion
} from '../../src/services/firebase/auth';
import { mockFirebaseAuth, mockFirestore } from '../utils/testUtils';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}));

describe('Firebase Auth Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create user successfully', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      const result = await signUp('test@example.com', 'password123', {
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle signup error', async () => {
      const mockError = new Error('Email already in use');
      mockFirebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(
        signUp('existing@example.com', 'password123', {
          firstName: 'John',
          lastName: 'Doe'
        })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      const result = await signIn('test@example.com', 'password123');

      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle signin error', async () => {
      const mockError = new Error('Invalid credentials');
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(
        signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockFirebaseAuth.signOut.mockResolvedValue();

      await signOut();

      expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle signout error', async () => {
      const mockError = new Error('Sign out failed');
      mockFirebaseAuth.signOut.mockRejectedValue(mockError);

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      mockFirebaseAuth.sendPasswordResetEmail.mockResolvedValue();

      await resetPassword('test@example.com');

      expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should handle password reset error', async () => {
      const mockError = new Error('User not found');
      mockFirebaseAuth.sendPasswordResetEmail.mockRejectedValue(mockError);

      await expect(
        resetPassword('nonexistent@example.com')
      ).rejects.toThrow('User not found');
    });
  });
});

describe('Firestore Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    it('should create user profile successfully', async () => {
      const mockDocRef = { id: 'user-123' };
      mockFirestore.setDoc.mockResolvedValue(mockDocRef);

      const profileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 16
      };

      const result = await createUserProfile('user-123', profileData);

      expect(mockFirestore.setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        uid: 'user-123',
        email: 'test@example.com',
        profile: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          age: 16
        })
      });
    });

    it('should handle profile creation error', async () => {
      const mockError = new Error('Permission denied');
      mockFirestore.setDoc.mockRejectedValue(mockError);

      const profileData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(
        createUserProfile('user-123', profileData)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      mockFirestore.updateDoc.mockResolvedValue();

      const updates = {
        'profile.firstName': 'Jane',
        'profile.age': 17
      };

      await updateUserProfile('user-123', updates);

      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should handle profile update error', async () => {
      const mockError = new Error('Document not found');
      mockFirestore.updateDoc.mockRejectedValue(mockError);

      const updates = {
        'profile.firstName': 'Jane'
      };

      await expect(
        updateUserProfile('user-123', updates)
      ).rejects.toThrow('Document not found');
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio successfully', async () => {
      const mockDocRef = { id: 'portfolio-123' };
      mockFirestore.addDoc.mockResolvedValue(mockDocRef);

      const result = await createPortfolio('user-123');

      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'portfolio-123',
        userId: 'user-123',
        holdings: [],
        totalValue: 0
      });
    });

    it('should handle portfolio creation error', async () => {
      const mockError = new Error('Failed to create portfolio');
      mockFirestore.addDoc.mockRejectedValue(mockError);

      await expect(
        createPortfolio('user-123')
      ).rejects.toThrow('Failed to create portfolio');
    });
  });

  describe('addHolding', () => {
    it('should add holding to portfolio successfully', async () => {
      const mockPortfolioDoc = {
        exists: () => true,
        data: () => ({
          holdings: []
        })
      };
      mockFirestore.getDoc.mockResolvedValue(mockPortfolioDoc);
      mockFirestore.updateDoc.mockResolvedValue();

      const holding = {
        symbol: 'AAPL',
        shares: 2,
        purchasePrice: 150.00
      };

      await addHolding('portfolio-123', holding);

      expect(mockFirestore.getDoc).toHaveBeenCalled();
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should handle add holding error', async () => {
      const mockError = new Error('Portfolio not found');
      mockFirestore.getDoc.mockRejectedValue(mockError);

      const holding = {
        symbol: 'AAPL',
        shares: 2,
        purchasePrice: 150.00
      };

      await expect(
        addHolding('portfolio-123', holding)
      ).rejects.toThrow('Portfolio not found');
    });
  });

  describe('updateHolding', () => {
    it('should update holding successfully', async () => {
      const mockPortfolioDoc = {
        exists: () => true,
        data: () => ({
          holdings: [
            {
              id: 'holding-1',
              symbol: 'AAPL',
              shares: 2
            }
          ]
        })
      };
      mockFirestore.getDoc.mockResolvedValue(mockPortfolioDoc);
      mockFirestore.updateDoc.mockResolvedValue();

      const updates = {
        shares: 3
      };

      await updateHolding('portfolio-123', 'holding-1', updates);

      expect(mockFirestore.getDoc).toHaveBeenCalled();
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should handle update holding error', async () => {
      const mockError = new Error('Holding not found');
      mockFirestore.getDoc.mockRejectedValue(mockError);

      const updates = {
        shares: 3
      };

      await expect(
        updateHolding('portfolio-123', 'holding-1', updates)
      ).rejects.toThrow('Holding not found');
    });
  });

  describe('saveSuggestion', () => {
    it('should save suggestion successfully', async () => {
      const mockDocRef = { id: 'suggestion-123' };
      mockFirestore.addDoc.mockResolvedValue(mockDocRef);

      const suggestionData = {
        type: 'investment',
        title: 'Test Suggestion',
        description: 'Test description',
        confidence: 85
      };

      const result = await saveSuggestion('user-123', suggestionData);

      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'suggestion-123',
        userId: 'user-123',
        type: 'investment',
        title: 'Test Suggestion'
      });
    });

    it('should handle save suggestion error', async () => {
      const mockError = new Error('Failed to save suggestion');
      mockFirestore.addDoc.mockRejectedValue(mockError);

      const suggestionData = {
        type: 'investment',
        title: 'Test Suggestion'
      };

      await expect(
        saveSuggestion('user-123', suggestionData)
      ).rejects.toThrow('Failed to save suggestion');
    });
  });
});
