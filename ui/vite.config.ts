import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'agent-resources-platform/convex/_generated': path.resolve(
        process.cwd(),
        'src/convex/_generated',
      ),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Performance optimizations
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-convex': ['convex', 'convex/react'],
          'vendor-ui': ['lucide-react'],

          // Feature chunks
          'feature-evaluations': [
            './src/views/EvaluationsView.tsx',
            './src/components/CreateSuiteModal.tsx',
            './src/components/CreateRunModal.tsx',
            './src/components/RunDetailsModal.tsx',
          ],
          'feature-analytics': [
            './src/views/AnalyticsView.tsx',
            './src/components/AnalyticsDashboard.tsx',
          ],
          'feature-admin': [
            './src/views/RolesView.tsx',
            './src/views/AuditView.tsx',
            './src/components/RoleManagement.tsx',
            './src/components/AuditLogViewer.tsx',
          ],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // KB

    // Source maps for production debugging
    sourcemap: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'convex/react'],
    exclude: [],
  },
});
