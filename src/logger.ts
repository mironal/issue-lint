import chalk from "chalk"
import { Report } from "./rules/types"
import terminalLink from "terminal-link"

const cl = console

export enum LOG_LEVEL {
  Debug = 1,
  Info = 10,
  Warn = 50,
  Error = 100,
  Disable = 100000,
}

export const Logger = (
  prefix: string,
  logLevel: LOG_LEVEL = LOG_LEVEL.Debug,
) => ({
  nl: (): void => cl.info(),
  debug: (message?: any, ...optionalParams: any[]): void => {
    if (logLevel <= LOG_LEVEL.Debug) {
      cl.info(chalk.gray(`[${prefix}:debug]`), ...[message, ...optionalParams])
    }
  },
  info: (message?: any, ...optionalParams: any[]): void => {
    if (logLevel <= LOG_LEVEL.Info) {
      cl.info(
        chalk.blueBright(`[${prefix}:info]`),
        ...[message, ...optionalParams],
      )
    }
  },
  warn: (message?: any, ...optionalParams: any[]): void => {
    if (logLevel <= LOG_LEVEL.Warn) {
      // tslint:disable-next-line:no-console
      cl.error(
        chalk.yellowBright(`[${prefix}:error]`),
        ...[message, ...optionalParams],
      )
    }
  },
  error: (message?: any, ...optionalParams: any[]): void => {
    if (logLevel <= LOG_LEVEL.Error) {
      // tslint:disable-next-line:no-console
      cl.error(
        chalk.redBright(`[${prefix}:error]`),
        ...[message, ...optionalParams],
      )
    }
  },
  success: (message?: any, ...optionalParams: any[]): void => {
    if (logLevel <= LOG_LEVEL.Disable) {
      cl.info(chalk.greenBright(`[${prefix}]`), ...[message, ...optionalParams])
    }
  },
  prettyReports: (reports: Report[]): void => {
    reports.forEach(report => {
      cl.info(
        `${terminalLink(
          `${report.issue.title} #${report.issue.number}`,
          report.issue.html_url,
        )}`,
      )
      report.violations.forEach(v => {
        const msg = `${v.rule.meta.name} violation ${chalk.gray(
          `(${v.rule.meta.identifier})`,
        )}: ${v.reason}`

        const severity =
          v.severity === "error"
            ? chalk.redBright("error")
            : chalk.yellowBright("warn")

        cl.error(`  ${severity}: ${msg}`)
      })
    })
  },
})

const L = Logger("issue-lint")

export default L
