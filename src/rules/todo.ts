import { Rule, Violation } from "./types"
import { Issue } from "../issue"

const rule: Rule = {
  meta: {
    identifier: "todo",
    name: "TODO",
    description: "The body of the issue should have TODO.",
  },
  validate(issue: Issue): Violation[] {
    const haveTODO = (issue.body || "")
      .split("\n")
      .some(line => line.trim().startsWith("- [] "))

    if (haveTODO) {
      return []
    }
    return [
      {
        rule,
        issue,
        severity: "error",
        reason: `The body of an issue must have "- [] " style TODO.`,
      },
    ]
  },
}

export default rule
