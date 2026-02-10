import { Id, Timestamps } from './common'

export type InstanceState =
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'READONLY'
  | 'DRAINING'
  | 'QUARANTINED'
  | 'RETIRED'

export interface AgentInstance extends Timestamps {
  _id: Id<'agentInstances'>
  versionId: Id<'agentVersions'>
  tenantId: Id<'tenants'>
  environmentId: Id<'environments'>
  providerId: Id<'providers'>
  state: InstanceState
  identityPrincipal?: string
  secretRef?: string
  policyEnvelopeId?: string
  heartbeatAt?: number
  metadata?: Record<string, any>
}
