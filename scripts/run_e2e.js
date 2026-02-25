const { spawn, exec } = require('child_process');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const FRONTEND_PORT = 3001; // matches dev server output
const BACKEND_PORT = 5001;

function isPortOpen(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { resolve(false); });
        socket.connect(port, host);
    });
}

function waitForPort(port, timeoutMs = 30000) {
    const start = Date.now();
    return new Promise(async (resolve, reject) => {
        while (Date.now() - start < timeoutMs) {
            if (await isPortOpen(port)) return resolve();
            await new Promise(r => setTimeout(r, 500));
        }
        reject(new Error(`Timed out waiting for port ${port}`));
    });
}

function runCommand(cmd, args, opts = {}) {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    return child;
}

(async () => {
    console.log('E2E runner: checking ports...');
    const backendOpen = await isPortOpen(BACKEND_PORT);
    const frontendOpen = await isPortOpen(FRONTEND_PORT);

    let backendProc = null;
    let frontendProc = null;
    let started = [];

    try {
        if (!backendOpen) {
            console.log('Starting backend server...');
            backendProc = runCommand('npm', ['run', 'start'], { cwd: BACKEND_DIR });
            started.push(backendProc);
        } else {
            console.log(`Backend already running on port ${BACKEND_PORT}`);
        }

        if (!frontendOpen) {
            console.log('Starting frontend dev server...');
            // Use PORT env override if desired
            frontendProc = runCommand('npm', ['start'], { cwd: FRONTEND_DIR });
            started.push(frontendProc);
        } else {
            console.log(`Frontend already running on port ${FRONTEND_PORT}`);
        }

        // Wait for both services
        console.log('Waiting for backend to be ready...');
        await waitForPort(BACKEND_PORT, 30000);
        console.log('Backend ready. Waiting for frontend...');
        await waitForPort(FRONTEND_PORT, 30000);
        console.log('Both services ready. Running UI test...');

        // Run the puppeteer test from frontend directory
        await new Promise((resolve, reject) => {
            const child = exec('node ./scripts/e2e_ui_test.js', { cwd: FRONTEND_DIR }, (err, stdout, stderr) => {
                if (stdout) process.stdout.write(stdout);
                if (stderr) process.stderr.write(stderr);
                if (err) return reject(err);
                resolve();
            });
            child.stdout && child.stdout.pipe(process.stdout);
            child.stderr && child.stderr.pipe(process.stderr);
        });

        console.log('UI test finished.');
    } catch (err) {
        console.error('E2E runner failed:', err.message || err);
        process.exitCode = 2;
    } finally {
        console.log('Cleaning up child processes (if we started any)...');
        for (const p of started) {
            try {
                if (!p || p.killed) continue;
                process.kill(p.pid, 'SIGTERM');
            } catch (e) {
                // ignore
            }
        }
        // Give a moment for processes to close
        await new Promise(r => setTimeout(r, 700));
        console.log('Done.');
    }
})();
