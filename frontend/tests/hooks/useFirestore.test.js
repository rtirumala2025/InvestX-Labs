import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock the firestore service wrapper used by the hook
jest.mock('../../src/services/firebase/firestore', () => {
  const subscribers = new Map();
  return {
    __esModule: true,
    subscribeToCollection: (collectionName, constraints, cb) => {
      const key = `${collectionName}|${JSON.stringify(constraints || [])}`;
      subscribers.set(key, cb);
      // Immediately emit empty to simulate initial state
      setTimeout(() => cb([]), 0);
      return () => subscribers.delete(key);
    },
    subscribeToDocument: (collectionName, docId, cb) => {
      const key = `${collectionName}/${docId}`;
      subscribers.set(key, cb);
      setTimeout(() => cb(null), 0);
      return () => subscribers.delete(key);
    },
    // Helpers to drive updates in tests
    __emitCollection: (collectionName, items, constraints = []) => {
      const key = `${collectionName}|${JSON.stringify(constraints || [])}`;
      const cb = subscribers.get(key);
      if (cb) cb(items);
    },
    __emitDocument: (collectionName, docId, doc) => {
      const key = `${collectionName}/${docId}`;
      const cb = subscribers.get(key);
      if (cb) cb(doc);
    },
    addDocument: jest.fn(async () => 'doc123'),
    updateDocument: jest.fn(async () => {}),
    deleteDocument: jest.fn(async () => {}),
    getDocument: jest.fn(async () => ({ id: 'docX', name: 'Test' })),
    getDocuments: jest.fn(async () => ([])),
  };
});

import * as firestoreSvc from '../../src/services/firebase/firestore';
import { useFirestore } from '../../src/hooks/useFirestore';

describe('useFirestore hook', () => {
  test('subscribes to a collection and receives updates', async () => {
    const { result } = renderHook(() => useFirestore('investmentStrategies'));

    // Initial state
    expect(result.current.loading).toBe(false);
    expect(Array.isArray(result.current.documents)).toBe(true);

    const sample = [
      { id: 's1', name: 'Conservative' },
      { id: 's2', name: 'Aggressive' },
    ];

    await act(async () => {
      firestoreSvc.__emitCollection('investmentStrategies', sample);
    });

    expect(result.current.documents).toHaveLength(2);
    expect(result.current.documents[0].name).toBe('Conservative');
  });

  test('single document subscription receives updates', async () => {
    const { result } = renderHook(() => useFirestore('users', 'uid_123'));

    expect(result.current.document).toBeNull();

    const doc = { id: 'uid_123', email: 'user@test.com' };

    await act(async () => {
      firestoreSvc.__emitDocument('users', 'uid_123', doc);
    });

    expect(result.current.document).toEqual(doc);
  });

  test('addDocument, updateDocument, deleteDocument proxies', async () => {
    const { result } = renderHook(() => useFirestore('holdings'));

    await act(async () => {
      const id = await result.current.addDocument({ symbol: 'AAPL' });
      expect(id).toBe('doc123');
      await result.current.updateDocument('doc123', { symbol: 'MSFT' });
      await result.current.deleteDocument('doc123');
    });

    expect(firestoreSvc.addDocument).toHaveBeenCalled();
    expect(firestoreSvc.updateDocument).toHaveBeenCalled();
    expect(firestoreSvc.deleteDocument).toHaveBeenCalled();
  });
});
