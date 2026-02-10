import { Id, Timestamps } from './common'

export type ProviderType = 'local' | 'federated'

export interface Provider extends Timestamps {
  _id: Id<'providers'>
  tenantId: Id<'tenants'>
  name: string
  type: ProviderType
  federationConfig?: Record<string, any>
  healthEndpoint?: string
  metadata?: Record<string, any>
}
