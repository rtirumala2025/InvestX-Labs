import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlassButton from '../../src/components/ui/GlassButton';

describe('GlassButton', () => {
  it('renders children correctly', () => {
    render(<GlassButton>Click me</GlassButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant classes', () => {
    render(<GlassButton variant="primary" data-testid="button">Test</GlassButton>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-glassAccent');
  });

  it('applies secondary variant classes', () => {
    render(<GlassButton variant="secondary" data-testid="button">Test</GlassButton>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-glassBg');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<GlassButton onClick={handleClick}>Click me</GlassButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<GlassButton disabled data-testid="button">Test</GlassButton>);
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
  });

  it('shows loading spinner when loading prop is true', () => {
    render(<GlassButton loading>Test</GlassButton>);
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders as custom component when as prop is provided', () => {
    const CustomComponent = ({ children, ...props }) => (
      <div data-testid="custom-component" {...props}>
        {children}
      </div>
    );
    
    render(
      <GlassButton as={CustomComponent} data-testid="button">
        Test
      </GlassButton>
    );
    
    expect(screen.getByTestId('custom-component')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <GlassButton aria-label="test button" data-testid="button">
        Test
      </GlassButton>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('aria-label', 'test button');
  });
});
