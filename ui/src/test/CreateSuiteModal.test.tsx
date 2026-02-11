import { render, screen } from '@testing-library/react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useMutation } from 'convex/react';
import { Id } from 'agent-resources-platform/convex/_generated/dataModel';
import { CreateSuiteModal } from '../components/CreateSuiteModal';

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useAction: vi.fn(),
}));

vi.mock('../lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('CreateSuiteModal', () => {
  const tenantId = 't1' as Id<'tenants'>;
  const operatorId = 'o1' as Id<'operators'>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders Create Evaluation Suite modal', () => {
    (useMutation as unknown as vi.Mock).mockReturnValue(vi.fn());

    render(
      <CreateSuiteModal
        tenantId={tenantId}
        operatorId={operatorId}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Create Evaluation Suite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Suite/i })).toBeInTheDocument();
  });
});
