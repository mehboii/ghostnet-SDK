import { access, realpath } from 'node:fs/promises';
import { delimiter, dirname, extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

/** The CLI is a separate process that uses this SDK. It has no attachable daemon. */
export interface CliStatus {
  available: boolean;
  executable: string | null;
  version: string | null;
  compatible: boolean;
  bridgeInstalled: boolean;
  detail: string;
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

function versionOf(executable: string): Promise<string | null> {
  return new Promise((done) => {
    const child = spawn(executable, ['--version'], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    let output = '';
    const timer = setTimeout(() => child.kill(), 3000);
    child.stdout.on('data', (chunk: Buffer) => { if (output.length < 256) output += chunk.toString(); });
    child.on('error', () => { clearTimeout(timer); done(null); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const match = code === 0 ? /^ghostnet\s+(\d+\.\d+\.\d+)/im.exec(output) : null;
      done(match?.[1] ?? null);
    });
  });
}

/** Locate the native `ghostnet` binary without invoking npm shell shims. */
export async function inspectCli(cliPath?: string): Promise<CliStatus> {
  const paths = cliPath
    ? [resolve(cliPath)]
    : (process.env.PATH ?? '').split(delimiter).filter(Boolean).flatMap((dir) =>
        process.platform === 'win32'
          ? [join(dir, 'ghostnet.exe'), join(dir, 'ghostnet.cmd')]
          : [join(dir, 'ghostnet')]);

  for (const candidate of paths) {
    if (!(await exists(candidate))) continue;
    let executable = candidate;
    const extension = extname(candidate).toLowerCase();
    if (extension === '.cmd' || extension === '.ps1') {
      executable = join(dirname(candidate), 'node_modules', '@n11x', 'ghostnet-cli', 'scripts', 'bin',
        process.platform === 'win32' ? 'ghostnet.exe' : 'ghostnet');
    } else if (extension === '.js' || extension === '.mjs' || process.platform !== 'win32') {
      const actual = await realpath(candidate).catch(() => candidate);
      if (actual.endsWith('run.js')) {
        executable = join(dirname(actual), 'bin', process.platform === 'win32' ? 'ghostnet.exe' : 'ghostnet');
      }
    }
    if (!(await exists(executable))) continue;
    const version = await versionOf(executable);
    if (!version) continue;
    const compatible = /^0\.2\./.test(version);
    const home = process.env.USERPROFILE ?? process.env.HOME;
    const bridgeInstalled = home ? await exists(join(home, '.ghostnet-cli', 'bridge', 'node_modules', '@n11x', 'ghostnet-sdk')) : false;
    return {
      available: true, executable, version, compatible, bridgeInstalled,
      detail: compatible
        ? bridgeInstalled ? 'CLI and SDK bridge detected. Both use the SDK relay client.' : 'CLI detected; run `ghostnet setup` to install its SDK bridge.'
        : `CLI ${version} has not been verified with this SDK protocol.`,
    };
  }
  return {
    available: false, executable: null, version: null, compatible: false, bridgeInstalled: false,
    detail: cliPath ? `No compatible GhostNet native executable found at ${cliPath}.` : 'GhostNet CLI not found on PATH. Install @n11x/ghostnet-cli or provide cliPath.',
  };
}
