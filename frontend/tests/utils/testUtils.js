/**
 * Test utilities and helpers
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/hooks/useAuth';
import { UserProvider } from '../../src/context/UserContext';
import { PortfolioProvider } from '../../src/context/PortfolioContext';
import { ThemeProvider } from '../../src/context/ThemeContext';

// Mock data
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

export const mockUserProfile = {
  firstName: 'Test',
  lastName: 'User',
  age: 16,
  monthlyAllowance: 100,
  investmentGoals: ['College Fund'],
  riskTolerance: 'moderate',
  interests: ['technology'],
  onboardingCompleted: true
};

export const mockPortfolio = {
  id: 'portfolio-123',
  userId: 'test-user-123',
  holdings: [
    {
      id: 'holding-1',
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      shares: 2,
      purchasePrice: 150.00,
      currentPrice: 175.50,
      purchaseDate: '2024-01-01',
      sector: 'Technology',
      assetType: 'Stock'
    }
  ],
  totalValue: 351.00,
  totalCostBasis: 300.00,
  totalGainLoss: 51.00,
  totalGainLossPercentage: 17.0,
  diversificationScore: 65,
  riskScore: 45
};

export const mockSuggestion = {
  id: 'suggestion-1',
  userId: 'test-user-123',
  type: 'investment',
  title: 'Consider Adding Microsoft (MSFT)',
  description: 'Microsoft offers strong growth potential...',
  reasoning: 'Based on your interest in technology...',
  confidence: 85,
  sourceStrategy: 'acorns',
  status: 'pending',
  createdAt: new Date()
};

// Custom render function with providers
export const renderWithProviders = (
  ui,
  {
    initialAuthState = { user: mockUser, loading: false },
    initialUserState = { profile: mockUserProfile, loading: false },
    initialPortfolioState = { portfolio: mockPortfolio, loading: false },
    initialThemeState = { theme: 'light', toggleTheme: jest.fn() },
    ...renderOptions
  } = {}
) => {
  const AllTheProviders = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthProvider value={initialAuthState}>
          <UserProvider value={initialUserState}>
            <PortfolioProvider value={initialPortfolioState}>
              <ThemeProvider value={initialThemeState}>
                {children}
              </ThemeProvider>
            </PortfolioProvider>
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Mock Firebase functions
export const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: mockUser
};

export const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn()
};

export const mockFunctions = {
  httpsCallable: jest.fn()
};

// Test helpers
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

export const expectElementToBeInDocument = (element) => {
  expect(element).toBeInTheDocument();
};

export const expectElementNotToBeInDocument = (element) => {
  expect(element).not.toBeInTheDocument();
};

export const expectElementToHaveText = (element, text) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element, className) => {
  expect(element).toHaveClass(className);
};

export const expectElementToBeDisabled = (element) => {
  expect(element).toBeDisabled();
};

export const expectElementToBeEnabled = (element) => {
  expect(element).toBeEnabled();
};

// Form testing helpers
export const fillInput = (input, value) => {
  fireEvent.change(input, { target: { value } });
};

export const submitForm = (form) => {
  fireEvent.submit(form);
};

export const clickButton = (button) => {
  fireEvent.click(button);
};

export const selectOption = (select, value) => {
  fireEvent.change(select, { target: { value } });
};

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
});

export const mockApiError = (message, status = 500) => {
  const error = new Error(message);
  error.response = {
    data: { message },
    status,
    statusText: 'Internal Server Error',
    headers: {},
    config: {}
  };
  return error;
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store = {};
  
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store = {};
  
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock window.location
export const mockWindowLocation = (url) => {
  delete window.location;
  window.location = new URL(url);
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
};

// Test data generators
export const generateMockUser = (overrides = {}) => ({
  uid: 'test-user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  displayName: 'Test User',
  ...overrides
});

export const generateMockHolding = (overrides = {}) => ({
  id: 'holding-' + Math.random().toString(36).substr(2, 9),
  symbol: 'AAPL',
  companyName: 'Apple Inc.',
  shares: 1,
  purchasePrice: 150.00,
  currentPrice: 175.50,
  purchaseDate: '2024-01-01',
  sector: 'Technology',
  assetType: 'Stock',
  ...overrides
});

export const generateMockSuggestion = (overrides = {}) => ({
  id: 'suggestion-' + Math.random().toString(36).substr(2, 9),
  userId: 'test-user-123',
  type: 'investment',
  title: 'Test Suggestion',
  description: 'Test description',
  reasoning: 'Test reasoning',
  confidence: 85,
  sourceStrategy: 'acorns',
  status: 'pending',
  createdAt: new Date(),
  ...overrides
});

// Async test helpers
export const waitForElementToBeRemoved = (element) =>
  waitFor(() => {
    expect(element).not.toBeInTheDocument();
  });

export const waitForTextToAppear = (text) =>
  waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });

export const waitForTextToDisappear = (text) =>
  waitFor(() => {
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });

// Custom matchers
export const expectToHaveBeenCalledWith = (mockFn, ...args) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

export const expectToHaveBeenCalledTimes = (mockFn, times) => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};

export const expectToHaveBeenCalled = (mockFn) => {
  expect(mockFn).toHaveBeenCalled();
};

export const expectNotToHaveBeenCalled = (mockFn) => {
  expect(mockFn).not.toHaveBeenCalled();
};
