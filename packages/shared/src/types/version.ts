import { Id, Timestamps } from './common'

export interface Genome {
  modelConfig: {
    provider: string
    model: string
    temperature?: number
    maxTokens?: number
  }
  promptBundleHash: string
  toolManifest: ToolManifestEntry[]
  provenance?: {
    builtAt: string
    builtBy: string
    commitRef?: string
    buildPipeline?: string
    parentVersionId?: string
  }
}

export interface ToolManifestEntry {
  toolId: string
  schemaVersion: string
  requiredPermissions: string[]
}

export type VersionLifecycleState =
  | 'DRAFT'
  | 'TESTING'
  | 'CANDIDATE'
  | 'APPROVED'
  | 'DEPRECATED'
  | 'RETIRED'

export type EvalStatus = 'NOT_RUN' | 'RUNNING' | 'PASS' | 'FAIL'

export interface AgentVersion extends Timestamps {
  _id: Id<'agentVersions'>
  templateId: Id<'agentTemplates'>
  tenantId: Id<'tenants'>
  versionLabel: string
  genome: Genome
  genomeHash: string
  lifecycleState: VersionLifecycleState
  evalStatus: EvalStatus
  parentVersionId?: Id<'agentVersions'>
  integrityStatus?: 'VERIFIED' | 'TAMPERED'
}
