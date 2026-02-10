export type Id<T extends string> = string & { __brand: T }

export interface Timestamps {
  createdAt: number
  updatedAt: number
}
