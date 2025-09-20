import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HomePage from '../../src/pages/HomePage';
import GlassCard from '../../src/components/ui/GlassCard';
import GlassButton from '../../src/components/ui/GlassButton';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    logout: jest.fn()
  })
}));

describe('Accessibility Tests', () => {
  it('HomePage should not have accessibility violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('GlassCard should not have accessibility violations', async () => {
    const { container } = render(
      <GlassCard aria-label="test card">
        <h2>Test Card</h2>
        <p>This is a test card content.</p>
      </GlassCard>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('GlassButton should not have accessibility violations', async () => {
    const { container } = render(
      <GlassButton aria-label="test button">
        Test Button
      </GlassButton>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Interactive GlassCard should be keyboard accessible', async () => {
    const { container } = render(
      <GlassCard interactive aria-label="interactive card">
        <h2>Interactive Card</h2>
        <p>This card can be focused and activated.</p>
      </GlassCard>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Disabled GlassButton should have proper ARIA attributes', async () => {
    const { container } = render(
      <GlassButton disabled aria-label="disabled button">
        Disabled Button
      </GlassButton>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
