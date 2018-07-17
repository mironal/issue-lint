import { Rule, Violation } from "./types"
import { Issue } from "../issue"

const MIN_LINES = 3

const rule: Rule = {
  meta: {
    identifier: "body_length",
    name: "Body line length",
    description: "The body of the issue should not be too short.",
  },
  validate(issue: Issue): Violation[] {
    const length = (issue.body || "")
      .replace("\r", "")
      .replace(/\n+/, "\n")
      .split("\n").length

    if (length < MIN_LINES) {
      return [
        {
          rule,
          severity: "error",
          reason: `The body of an issue must be at least ${MIN_LINES} lines.`,
        },
      ]
    }

    return []
  },
}

export default rule
