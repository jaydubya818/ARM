import { Id, Timestamps } from './common'

export interface Environment extends Timestamps {
  _id: Id<'environments'>
  tenantId: Id<'tenants'>
  name: string
  slug: string
  config?: Record<string, any>
}
