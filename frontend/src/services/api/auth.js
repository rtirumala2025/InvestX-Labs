// Mock authentication service
export const getSession = () => ({
  user: { id: 'anonymous' },
  accessToken: null,
  sessionId: 'mock-session-id'
});

export const isAuthenticated = () => {
  const session = getSession();
  return !!session?.accessToken;
};

export default {
  getSession,
  isAuthenticated
};
