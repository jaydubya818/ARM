import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateRunModal } from '../components/CreateRunModal'
import { Id } from '../convex/_generated/dataModel'
import { api } from '../convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useAction: vi.fn(),
}))

vi.mock('../lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('CreateRunModal', () => {
  const tenantId = 't1' as Id<'tenants'>
  const suiteId = 's1' as Id<'evaluationSuites'>
  const versionId = 'v1' as Id<'agentVersions'>

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders Create Evaluation Run modal', () => {
    ;(useMutation as unknown as vi.Mock).mockReturnValue(vi.fn())
    ;(useQuery as unknown as vi.Mock).mockReturnValue([])

    render(<CreateRunModal tenantId={tenantId} onClose={() => {}} />)

    expect(screen.getByText('Create Evaluation Run')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Run/i })).toBeInTheDocument()
  })
})
