import { Id, Timestamps } from './common'

export interface Tenant extends Timestamps {
  _id: Id<'tenants'>
  name: string
  slug: string
  settings?: Record<string, any>
}
