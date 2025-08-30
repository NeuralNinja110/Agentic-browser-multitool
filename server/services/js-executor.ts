import { Worker } from 'worker_threads';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export class JsExecutorService {
  async execute(code: string, timeout: number = 5000) {
    const executionId = randomUUID();
    const workerPath = join(process.cwd(), `temp-worker-${executionId}.js`);
    
    try {
      // Create a sandboxed worker script
      const workerScript = `
        const { parentPort } = require('worker_threads');
        
        // Sandbox the global environment
        const originalConsole = console;
        const logs = [];
        
        global.console = {
          log: (...args) => logs.push({ type: 'log', args }),
          error: (...args) => logs.push({ type: 'error', args }),
          warn: (...args) => logs.push({ type: 'warn', args }),
          info: (...args) => logs.push({ type: 'info', args }),
        };
        
        // Disable dangerous globals
        global.process = undefined;
        global.require = undefined;
        global.module = undefined;
        global.exports = undefined;
        global.__filename = undefined;
        global.__dirname = undefined;
        global.global = undefined;
        
        try {
          const startTime = Date.now();
          
          // Execute the user code
          const result = eval(\`${code.replace(/`/g, '\\`')}\`);
          
          const endTime = Date.now();
          
          parentPort.postMessage({
            success: true,
            result: result,
            logs: logs,
            executionTime: endTime - startTime,
          });
        } catch (error) {
          parentPort.postMessage({
            success: false,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            logs: logs,
          });
        }
      `;

      writeFileSync(workerPath, workerScript);

      return new Promise((resolve, reject) => {
        const worker = new Worker(workerPath);
        
        const timer = setTimeout(() => {
          worker.terminate();
          resolve({
            success: false,
            error: 'Execution timeout',
            executionTime: timeout,
          });
        }, timeout);

        worker.on('message', (result) => {
          clearTimeout(timer);
          worker.terminate();
          resolve(result);
        });

        worker.on('error', (error) => {
          clearTimeout(timer);
          resolve({
            success: false,
            error: error.message,
            executionTime: 0,
          });
        });

        worker.on('exit', (code) => {
          clearTimeout(timer);
          if (code !== 0) {
            resolve({
              success: false,
              error: `Worker stopped with exit code ${code}`,
              executionTime: 0,
            });
          }
        });
      });
    } catch (error) {
      console.error('JavaScript Executor Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
      };
    } finally {
      // Clean up temporary worker file
      try {
        unlinkSync(workerPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}
