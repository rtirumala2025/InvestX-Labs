/**
 * Button component tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../src/components/ui/Button';
import { renderWithProviders } from '../utils/testUtils';

describe('Button Component', () => {
  it('renders button with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant styles', () => {
    renderWithProviders(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('applies secondary variant styles', () => {
    renderWithProviders(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-secondary');
  });

  it('applies outline variant styles', () => {
    renderWithProviders(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-outline');
  });

  it('applies ghost variant styles', () => {
    renderWithProviders(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-ghost');
  });

  it('applies small size styles', () => {
    renderWithProviders(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-sm');
  });

  it('applies large size styles', () => {
    renderWithProviders(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-lg');
  });

  it('disables button when disabled prop is true', () => {
    renderWithProviders(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    renderWithProviders(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders loading state', () => {
    renderWithProviders(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/loading/i);
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">📊</span>;
    renderWithProviders(
      <Button icon={<TestIcon />}>
        Button with Icon
      </Button>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Button with Icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithProviders(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef();
    renderWithProviders(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders as different element when as prop is provided', () => {
    renderWithProviders(<Button as="a" href="/test">Link Button</Button>);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies full width when fullWidth prop is true', () => {
    renderWithProviders(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });
});
