import { GitHubTokenStore } from "@mironal/github-token-store"
import inquirer from "inquirer"
import PATH from "path"
import OS from "os"
import GitHub from "@octokit/rest"

import L from "./logger"
import { Issue } from "./issue"
import rules, { prettyString } from "./rules"
import { Violation } from "./rules/types"

const store = new GitHubTokenStore(
  PATH.join(OS.homedir(), ".config/issue-lint/github"),
)

const proceedAuth = async () => {
  const { username, password } = await inquirer.prompt<{
    username: string
    password: string
  }>([
    {
      type: "input",
      name: "username",
      message: "Your GitHub user name?",
    },
    {
      type: "password",
      name: "password",
      mask: "*",
      message:
        "Your GitHub password (Password will only be used to generate GitHub token)",
    },
  ])

  await store.authenticate(username, password, {
    scopes: ["repo"],
    note: "create for issue-lint",
  })
}

const performAuth = async () => {
  const answers = await inquirer.prompt<{ create: string }>([
    {
      type: "comfirm",
      name: "create",
      message: `Your GitHub private access token for issue-lint not found.
Create new private access token now (scopes is repo)?[y/n]`,
    },
  ])
  const { create } = answers
  if (create.toLowerCase().startsWith("y")) {
    await proceedAuth()
  } else {
    throw new Error("User canceled")
  }
}

const repoParamFromPrompt = async () => {
  const { r } = await inquirer.prompt<{ r: string }>([
    {
      type: "input",
      name: "r",
      message: "input owner/repo",
    },
  ])
  const [owner, repo] = r.split("/")

  if (owner && repo) {
    return Promise.resolve({ owner, repo })
  }
  throw new Error("Invalid arguments.")
}

const repoParamFromArgv = async () => {
  const arg = process.argv[2]
  if (!arg) {
    throw new Error("Invalid arguments.")
  }
  const [owner, repo] = (process.argv[2] || "").split("/")
  if (owner && repo) {
    return Promise.resolve({ owner, repo })
  }
  throw new Error("Invalid arguments.")
}

const flatMap = <A, B>(a: A[], f: (a: A) => B[]) =>
  a.map(f).reduce((xs, ys) => [...xs, ...ys], [])

const runLint = async (
  owner: string,
  repo: string,
): Promise<{ violations: Violation[]; issues: Issue[] }> => {
  L.debug("Loading auth token...")

  const token = await store.readToken()
  if (!token) {
    throw new Error(`Invalid auth token file. Please delete ${store.storePath}`)
  }

  L.debug("Auth token loaded")
  const client = new GitHub()
  client.authenticate({
    type: "token",
    token,
  })

  return client.issues
    .getForRepo({
      owner,
      repo,
      per_page: 100,
    })
    .then(resp => (resp.data as Issue[]).filter(i => !i.pull_request))
    .then(issues =>
      Promise.resolve({
        issues,
        violations: flatMap(issues, i => flatMap(rules, r => r.validate(i))),
      }),
    )
}

if (
  process.argv.includes("-h") ||
  process.argv.includes("--help") ||
  process.argv.includes("help")
) {
  L.info("print help")
} else if (!store.exists()) {
  performAuth()
    .then(() =>
      L.success(
        `Authentication succeeded. token created to ${store.storePath}`,
      ),
    )
    .catch(error => {
      L.error(error.message)
      process.exitCode = -1
    })
} else {
  const interactive =
    process.argv.includes("-i") || process.argv.includes("--interactive")

  const paramFn = async () =>
    interactive ? repoParamFromPrompt() : repoParamFromArgv()

  paramFn()
    .then(({ owner, repo }) => runLint(owner, repo))
    .then(({ violations, issues }) => {
      if (violations.length > 0) {
        process.exitCode = -2
        violations.forEach(v => {
          const pretty = prettyString(v)
          if (v.severity === "warning") {
            L.warn(pretty)
          } else if (v.severity === "error") {
            L.error(pretty)
          }
        })
        L.nl()
      }
      L.info(
        `${violations.length} violation(s) found in ${issues.length} issue(s).`,
      )
    })
    .catch(error => {
      L.error(error.message)
      process.exitCode = -1
    })
}
