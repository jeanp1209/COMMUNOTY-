import { spawn, ChildProcess } from 'child_process'
import * as Path from 'path'
import { assertNever } from '../fatal-error'
import { enumerateValues, HKEY, RegistryValueType } from 'registry-js'
import { IFoundShell } from './found-shell'

export enum Shell {
  Cmd = 'Command Prompt',
  PowerShell = 'PowerShell',
  Hyper = 'Hyper',
  GitBash = 'Git Bash',
}

export const Default = Shell.Cmd

export function parse(label: string): Shell {
  if (label === Shell.Cmd) {
    return Shell.Cmd
  }

  if (label === Shell.PowerShell) {
    return Shell.PowerShell
  }

  if (label === Shell.Hyper) {
    return Shell.Hyper
  }

  if (label === Shell.GitBash) {
    return Shell.GitBash
  }

  return Default
}

export async function getAvailableShells(): Promise<
  ReadonlyArray<IFoundShell<Shell>>
> {
  const shells = [
    {
      shell: Shell.Cmd,
      path: process.env.comspec || 'C:\\Windows\\System32\\cmd.exe',
    },
  ]

  const powerShell = enumerateValues(
    HKEY.HKEY_LOCAL_MACHINE,
    'Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\PowerShell.exe'
  )
  if (powerShell.length > 0) {
    const first = powerShell[0]

    // NOTE:
    // on Windows 7 these are both REG_SZ, which technically isn't supposed
    // to contain unexpanded references to environment variables. But given
    // it's also %SystemRoot% and we do the expanding here I think this is
    // a fine workaround to do to support the maximum number of setups.

    if (
      first.type === RegistryValueType.REG_EXPAND_SZ ||
      first.type === RegistryValueType.REG_SZ
    ) {
      const path = first.data.replace(
        /^%SystemRoot%/i,
        process.env.SystemRoot || 'C:\\Windows'
      )
      shells.push({
        shell: Shell.PowerShell,
        path,
      })
    }
  }

  const hyper = enumerateValues(
    HKEY.HKEY_CURRENT_USER,
    'Software\\Classes\\Directory\\Background\\shell\\Hyper\\command'
  )
  if (hyper.length > 0) {
    const first = hyper[0]
    if (first.type === RegistryValueType.REG_SZ) {
      // Registry key is structured as "{installationPath}\app-x.x.x\Hyper.exe" "%V"

      // This regex is designed to get the path to the version-specific Hyper.
      // commandPieces = ['"{installationPath}\app-x.x.x\Hyper.exe"', '"', '{installationPath}\app-x.x.x\Hyper.exe', ...]
      const commandPieces = first.data.match(/(["'])(.*?)\1/)
      const path = commandPieces
        ? commandPieces[2]
        : process.env.LocalAppData.concat('\\hyper\\Hyper.exe') // fall back to the launcher in install root
      shells.push({
        shell: Shell.Hyper,
        path: path,
      })
    }
  }

  const gitBash = enumerateValues(
    HKEY.HKEY_LOCAL_MACHINE,
    'SOFTWARE\\GitForWindows'
  )

  if (gitBash.length > 0) {
    const installPathEntry = gitBash.find(e => e.name === 'InstallPath')
    if (
      installPathEntry &&
      installPathEntry.type === RegistryValueType.REG_SZ
    ) {
      shells.push({
        shell: Shell.GitBash,
        path: Path.join(installPathEntry.data, 'git-bash.exe'),
      })
    }
  }

  return shells
}

export function launch(
  foundShell: IFoundShell<Shell>,
  path: string
): ChildProcess {
  const shell = foundShell.shell

  switch (shell) {
    case Shell.PowerShell:
      const psCommand = `"Set-Location -LiteralPath '${path}'"`
      return spawn('START', ['powershell', '-NoExit', '-Command', psCommand], {
        shell: true,
        cwd: path,
      })
    case Shell.Hyper:
      const hyperPath = `"${foundShell.path}"`
      log.info(`launching ${shell} at path: ${hyperPath}`)
      return spawn(hyperPath, [`"${path}"`], {
        shell: true,
        cwd: path,
      })
    case Shell.GitBash:
      const gitBashPath = `"${foundShell.path}"`
      log.info(`launching ${shell} at path: ${gitBashPath}`)
      return spawn(gitBashPath, [`--cd="${path}"`], {
        shell: true,
        cwd: path,
      })
    case Shell.Cmd:
      return spawn('START', ['cmd'], { shell: true, cwd: path })
    default:
      return assertNever(shell, `Unknown shell: ${shell}`)
  }
}
