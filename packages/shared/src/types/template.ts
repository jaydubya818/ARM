import { Id, Timestamps } from './common';

export interface AgentTemplate extends Timestamps {
  _id: Id<'agentTemplates'>
  tenantId: Id<'tenants'>
  name: string
  description?: string
  owners: string[]
  tags: string[]
}
