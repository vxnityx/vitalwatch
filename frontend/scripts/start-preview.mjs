import { spawn } from 'node:child_process';

const port = process.env.PORT || '4173';
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const child = spawn(command, ['exec', 'vite', 'preview', '--host', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});