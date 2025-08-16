#!/usr/bin/env node

/**
 * Test runner for comprehensive unit tests
 * Uses Node.js built-in test runner for zero dependencies
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Binomial Options Library Unit Tests');
console.log('='.repeat(50));

// Run the unit tests using Node.js built-in test runner
const testFile = join(__dirname, 'unit.test.js');

const testProcess = spawn('node', ['--test', '--test-reporter=spec', testFile], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--experimental-test-coverage' }
});

testProcess.on('close', (code) => {
    console.log('\n' + '='.repeat(50));
    if (code === 0) {
        console.log('✅ All unit tests passed!');
        console.log('📊 Test Coverage: Run with --experimental-test-coverage for details');
    } else {
        console.log('❌ Some tests failed!');
        process.exit(code);
    }
});

testProcess.on('error', (error) => {
    console.error('Failed to start test process:', error);
    process.exit(1);
});