import { useMemo } from 'react';

/**
 * useInvestIQChat
 * Sends chat messages to the Node.js backend at {BACKEND_URL}/api/chat
 * - Uses REACT_APP_BACKEND_URL for the base, falls back to relative path
 * - Payload: { message, userProfile }
 * - Response: { reply, structuredData? }
 */
export const useInvestIQChat = () => {
  const CHAT_URL = useMemo(() => {
    const base = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
    return `${base}${base ? '' : ''}/api/chat`; // if base is empty, use relative /api/chat
  }, []);

  const sendMessage = async (message, userProfile, { signal } = {}) => {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const payload = {
      message,
      userProfile: {
        age: userProfile?.age ?? 16,
        experience_level: userProfile?.experience_level || 'beginner',
        risk_tolerance: userProfile?.risk_tolerance || 'moderate',
        budget: userProfile?.budget ?? null,
        portfolio_value: Number(userProfile?.portfolio_value || 0),
        interests: Array.isArray(userProfile?.interests) ? userProfile.interests : []
      }
    };

    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
      signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `AI service unavailable (status ${res.status})`);
    }

    const data = await res.json();
    return {
      reply: data?.reply ?? '',
      structuredData: data?.structuredData ?? null
    };
  };

  return { sendMessage };
};

export default useInvestIQChat;
