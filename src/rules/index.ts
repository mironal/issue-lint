import { Rule } from "./types"
import BodyLength from "./body_length"
import TODO from "./todo"

const rules: Rule[] = [BodyLength, TODO]

rules.forEach(r => {
  if (r.meta.identifier !== r.meta.identifier.toLowerCase()) {
    throw new Error(
      `Invalid rule identifier (${
        r.meta.identifier
      }). A rule identifier must be a lower case string.`,
    )
  }
  if (r.meta.identifier.match(/\s/)) {
    throw new Error(
      `Invalid rule identifier (${
        r.meta.identifier
      }). A rule identifer can only include [a-z0-9_]`,
    )
  }
})

export default rules
