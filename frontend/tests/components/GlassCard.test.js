import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlassCard from '../../src/components/ui/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div>Test content</div>
      </GlassCard>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(
      <GlassCard data-testid="glass-card">
        <div>Test</div>
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('bg-glassBg', 'border-glassBorder');
  });

  it('applies light variant classes', () => {
    render(
      <GlassCard variant="light" data-testid="glass-card">
        <div>Test</div>
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('bg-glassBgLight', 'border-glassBorderLight');
  });

  it('applies custom className', () => {
    render(
      <GlassCard className="custom-class" data-testid="glass-card">
        <div>Test</div>
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('custom-class');
  });

  it('applies interactive classes when interactive prop is true', () => {
    render(
      <GlassCard interactive data-testid="glass-card">
        <div>Test</div>
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('has correct ARIA attributes', () => {
    render(
      <GlassCard aria-label="test card" data-testid="glass-card">
        <div>Test</div>
      </GlassCard>
    );
    
    const card = screen.getByTestId('glass-card');
    expect(card).toHaveAttribute('role', 'region');
    expect(card).toHaveAttribute('aria-label', 'test card');
  });
});
