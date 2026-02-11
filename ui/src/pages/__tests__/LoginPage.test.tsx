import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';

vi.mock('@clerk/clerk-react', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoginPage', () => {
  it('renders ARM branding', () => {
    render(<LoginPage />);
    expect(screen.getByText('ARM')).toBeInTheDocument();
    expect(screen.getByText('Agent Resource Management')).toBeInTheDocument();
  });

  it('shows Sign In and Create Account buttons', () => {
    render(<LoginPage />);
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
  });
});
