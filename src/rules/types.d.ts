import { Issue } from "../issue"

export type ViolationSeverity = "warning" | "error"

export interface Violation {
  severity: ViolationSeverity
  rule: Rule
  reason: string
}

export interface Report {
  issue: Issue
  violations: Violation[]
}

export interface RuleMeta {
  identifier: string
  name: string
  description: string
}

export interface Rule {
  meta: RuleMeta
  validate(issue: Issue): Violation[]
}
