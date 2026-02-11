import { Id, Timestamps } from './common';

export type ChangeRecordType =
  | 'TEMPLATE_CREATED'
  | 'TEMPLATE_UPDATED'
  | 'VERSION_CREATED'
  | 'VERSION_TRANSITIONED'
  | 'VERSION_INTEGRITY_VERIFIED'
  | 'VERSION_INTEGRITY_FAILED'
  | 'INSTANCE_CREATED'
  | 'INSTANCE_TRANSITIONED'
  | 'INSTANCE_HEARTBEAT'
  | 'DEPLOYMENT_UPDATED'
  | 'POLICY_ATTACHED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_DECIDED'

export interface ChangeRecord extends Timestamps {
  _id: Id<'changeRecords'>
  tenantId: Id<'tenants'>
  type: ChangeRecordType
  targetEntity: string
  targetId: string
  operatorId?: Id<'operators'>
  payload: Record<string, any>
  timestamp: number
}
