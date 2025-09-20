import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../../src/hooks/useTranslation';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('useTranslation', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('returns English translations by default', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.language).toBe('en');
    expect(result.current.t('common.loading')).toBe('Loading...');
  });

  it('returns Spanish translations when language is set to es', () => {
    localStorageMock.getItem.mockReturnValue('es');
    
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.language).toBe('es');
    expect(result.current.t('common.loading')).toBe('Cargando...');
  });

  it('changes language and updates translations', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    const { result } = renderHook(() => useTranslation());
    
    act(() => {
      result.current.changeLanguage('es');
    });
    
    expect(result.current.language).toBe('es');
    expect(result.current.t('common.loading')).toBe('Cargando...');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'es');
  });

  it('returns fallback when translation key is not found', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.t('nonexistent.key', 'Fallback text')).toBe('Fallback text');
  });

  it('returns key as fallback when no fallback is provided', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('provides available languages', () => {
    localStorageMock.getItem.mockReturnValue('en');
    
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.availableLanguages).toEqual(['en', 'es']);
  });
});
