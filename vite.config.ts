import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], resolve: { preserveSymlinks: process.platform === 'win32', alias: { events: 'events/' } }, build: { target: 'es2022' } });
