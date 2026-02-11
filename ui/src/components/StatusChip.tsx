interface StatusChipProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
  type?: 'version' | 'instance' | 'approval' | 'eval' | 'generic'
}

export function StatusChip({ status, size = 'md', type = 'generic' }: StatusChipProps) {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  // Color classes based on type and status
  const getColorClasses = () => {
    // Version lifecycle states
    if (type === 'version') {
      switch (status) {
        case 'DRAFT':
          return 'bg-gray-500 text-white'
        case 'TESTING':
          return 'bg-arm-warning text-white'
        case 'CANDIDATE':
          return 'bg-arm-blue text-white'
        case 'APPROVED':
          return 'bg-arm-success text-white'
        case 'DEPRECATED':
          return 'bg-gray-600 text-white'
        case 'RETIRED':
          return 'bg-gray-700 text-white'
        default:
          return 'bg-gray-500 text-white'
      }
    }

    // Instance states
    if (type === 'instance') {
      switch (status) {
        case 'PROVISIONING':
          return 'bg-arm-warning text-white'
        case 'ACTIVE':
          return 'bg-arm-success text-white'
        case 'PAUSED':
          return 'bg-gray-500 text-white'
        case 'READONLY':
          return 'bg-gray-600 text-white'
        case 'DRAINING':
          return 'bg-arm-warning text-white'
        case 'QUARANTINED':
          return 'bg-arm-danger text-white'
        case 'RETIRED':
          return 'bg-gray-700 text-white'
        default:
          return 'bg-gray-500 text-white'
      }
    }

    // Approval states
    if (type === 'approval') {
      switch (status) {
        case 'PENDING':
          return 'bg-arm-warning text-white'
        case 'APPROVED':
          return 'bg-arm-success text-white'
        case 'DENIED':
          return 'bg-arm-danger text-white'
        case 'CANCELLED':
          return 'bg-gray-500 text-white'
        default:
          return 'bg-gray-500 text-white'
      }
    }

    // Eval status (version evalStatus or run status)
    if (type === 'eval') {
      switch (status) {
        case 'NOT_RUN':
          return 'bg-gray-500 text-white'
        case 'PENDING':
          return 'bg-gray-600 text-white'
        case 'RUNNING':
          return 'bg-arm-warning text-white'
        case 'PASS':
        case 'COMPLETED':
          return 'bg-arm-success text-white'
        case 'FAIL':
        case 'FAILED':
          return 'bg-arm-danger text-white'
        case 'CANCELLED':
          return 'bg-gray-500 text-white'
        default:
          return 'bg-gray-500 text-white'
      }
    }

    // Generic (fallback)
    return 'bg-arm-accent text-white'
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses[size]} ${getColorClasses()}`}
    >
      {status}
    </span>
  )
}
