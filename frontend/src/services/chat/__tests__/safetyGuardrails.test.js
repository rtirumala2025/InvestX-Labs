import { describe, it, expect, vi } from 'vitest';
import { checkSafety } from '../safetyGuardrails';

describe('Safety Guardrails', () => {
  it('should detect specific stock mentions', async () => {
    const result = await checkSafety('Should I buy Tesla stock?');
    expect(result.detected).toBe(true);
    expect(result.type).toBe('specific_stock');
  });

  it('should detect crypto mentions', async () => {
    const result = await checkSafety('What about Bitcoin?');
    expect(result.detected).toBe(true);
    expect(result.type).toBe('crypto');
  });

  it('should allow safe queries', async () => {
    const result = await checkSafety('What is compound interest?');
    expect(result.detected).toBe(false);
  });

  it('should handle age restrictions', async () => {
    const result = await checkSafety('I\'m 15, can I trade options?');
    expect(result.detected).toBe(true);
    expect(result.type).toBe('age_restricted');
  });
});
