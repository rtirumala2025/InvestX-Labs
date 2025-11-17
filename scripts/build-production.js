#!/usr/bin/env node

/**
 * Production Build Script for InvestX Labs
 * 
 * Builds frontend and backend for production deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    log(`\n${colors.cyan}▶ ${command}${colors.reset}`, 'cyan');
    execSync(command, {
      stdio: 'inherit',
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...options.env },
    });
    return true;
  } catch (error) {
    log(`\n❌ Error executing: ${command}`, 'red');
    throw error;
  }
}

// Build configuration
const BUILD_CONFIG = {
  outputDir: path.join(rootDir, 'PRODUCTION_PACKAGE'),
  frontendBuildDir: path.join(rootDir, 'frontend', 'dist'),
  backendBuildDir: path.join(rootDir, 'PRODUCTION_PACKAGE', 'backend'),
  frontendSource: path.join(rootDir, 'frontend'),
  backendSource: path.join(rootDir, 'backend'),
};

// Clean previous builds
function cleanBuild() {
  log('\n🧹 Cleaning previous builds...', 'yellow');
  
  // Remove production package directory
  if (fs.existsSync(BUILD_CONFIG.outputDir)) {
    fs.rmSync(BUILD_CONFIG.outputDir, { recursive: true, force: true });
    log('✓ Removed PRODUCTION_PACKAGE directory', 'green');
  }
  
  // Remove frontend dist directory
  if (fs.existsSync(BUILD_CONFIG.frontendBuildDir)) {
    fs.rmSync(BUILD_CONFIG.frontendBuildDir, { recursive: true, force: true });
    log('✓ Removed frontend/dist directory', 'green');
  }
  
  // Remove frontend build directory (react-scripts default)
  const reactBuildDir = path.join(BUILD_CONFIG.frontendSource, 'build');
  if (fs.existsSync(reactBuildDir)) {
    fs.rmSync(reactBuildDir, { recursive: true, force: true });
    log('✓ Removed frontend/build directory', 'green');
  }
}

// Install frontend dependencies
function installFrontendDeps() {
  log('\n📦 Installing frontend dependencies...', 'yellow');
  exec('npm install', { cwd: BUILD_CONFIG.frontendSource });
  log('✓ Frontend dependencies installed', 'green');
}

// Build frontend
function buildFrontend() {
  log('\n🏗️  Building frontend for production...', 'yellow');
  
  // Set production environment variables
  // Note: react-scripts always outputs to 'build', we'll rename to 'dist' after
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    GENERATE_SOURCEMAP: 'false', // Disable source maps
    INLINE_RUNTIME_CHUNK: 'false', // Don't inline runtime chunk
    DISABLE_ESLINT_PLUGIN: 'true', // Disable ESLint in production build
  };
  
  exec('npm run build', {
    cwd: BUILD_CONFIG.frontendSource,
    env: buildEnv,
  });
  
  log('✓ Frontend build complete', 'green');
  
  // react-scripts outputs to 'build', rename to 'dist'
  const buildPath = path.join(BUILD_CONFIG.frontendSource, 'build');
  const distPath = path.join(BUILD_CONFIG.frontendSource, 'dist');
  
  if (fs.existsSync(buildPath)) {
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    fs.renameSync(buildPath, distPath);
    log('✓ Build output moved to dist directory', 'green');
  } else {
    throw new Error('Frontend build output not found in build directory!');
  }
}

// Generate bundle size report
function generateBundleSizeReport() {
  log('\n📊 Generating bundle size report...', 'yellow');
  
  const distPath = path.join(BUILD_CONFIG.frontendSource, 'dist');
  if (!fs.existsSync(distPath)) {
    log('⚠️  Build directory not found, skipping bundle size report', 'yellow');
    return;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    files: [],
    totalSize: 0,
  };
  
  function analyzeDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        analyzeDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        const size = stats.size;
        report.totalSize += size;
        
        report.files.push({
          path: relPath,
          size: size,
          sizeFormatted: formatBytes(size),
        });
      }
    }
  }
  
  analyzeDirectory(distPath);
  
  // Sort by size (largest first)
  report.files.sort((a, b) => b.size - a.size);
  
  // Write report
  const reportDir = path.join(BUILD_CONFIG.outputDir, 'frontend');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'bundle-size-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('✓ Bundle size report generated', 'green');
  log(`  Total size: ${formatBytes(report.totalSize)}`, 'cyan');
  log(`  Largest files:`, 'cyan');
  report.files.slice(0, 10).forEach(file => {
    log(`    ${file.path}: ${file.sizeFormatted}`, 'cyan');
  });
  
  return report;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Package backend
function packageBackend() {
  log('\n📦 Packaging backend for production...', 'yellow');
  
  const backendOutput = BUILD_CONFIG.backendBuildDir;
  fs.mkdirSync(backendOutput, { recursive: true });
  
  // Files and directories to include
  const includePatterns = [
    'index.js',
    'package.json',
    'package-lock.json',
    'config',
    'controllers',
    'routes',
    'middleware',
    'utils',
    'market',
    'mcp',
    'ai-system',
    'supabase',
  ];
  
  // Files and directories to exclude
  const excludePatterns = [
    'node_modules/',
    'logs/',
    'scripts/',
    'test-server/',
    'legacy/',
    'ai_services/',
    'data/',
    'functions/__tests__/',
    '*.test.js',
    '*.test.mjs',
    '*.test.cjs',
    '.env',
    '.env.*',
    '.git/',
    '.gitignore',
  ];
  
  function shouldInclude(filePath) {
    const relPath = path.relative(BUILD_CONFIG.backendSource, filePath);
    const normalizedPath = relPath.replace(/\\/g, '/'); // Normalize path separators
    
    // Check exclude patterns first
    for (const pattern of excludePatterns) {
      const normalizedPattern = pattern.replace(/\\/g, '/');
      if (normalizedPath.includes(normalizedPattern) || 
          normalizedPath.match(new RegExp(normalizedPattern.replace(/\*/g, '.*')))) {
        return false;
      }
    }
    
    // Check include patterns
    for (const pattern of includePatterns) {
      const normalizedPattern = pattern.replace(/\\/g, '/');
      // Match if path is exactly the pattern, or starts with pattern followed by /
      if (normalizedPath === normalizedPattern || 
          normalizedPath.startsWith(normalizedPattern + '/')) {
        return true;
      }
    }
    
    return false;
  }
  
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const entries = fs.readdirSync(src);
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        
        if (shouldInclude(srcPath)) {
          copyRecursive(srcPath, destPath);
        }
      }
    } else {
      if (shouldInclude(src)) {
        fs.copyFileSync(src, dest);
      }
    }
  }
  
  // Copy files
  const entries = fs.readdirSync(BUILD_CONFIG.backendSource);
  for (const entry of entries) {
    const srcPath = path.join(BUILD_CONFIG.backendSource, entry);
    const destPath = path.join(backendOutput, entry);
    
    if (shouldInclude(srcPath)) {
      copyRecursive(srcPath, destPath);
    }
  }
  
  // Create production package.json (remove dev scripts)
  const packageJsonPath = path.join(backendOutput, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Remove dev-only scripts
    const productionScripts = {
      start: packageJson.scripts?.start || 'node index.js',
    };
    
    packageJson.scripts = productionScripts;
    
    // Remove devDependencies
    delete packageJson.devDependencies;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('✓ Created production package.json', 'green');
  }
  
  // Create .npmignore to prevent installing dev dependencies
  const npmignoreContent = `node_modules/
logs/
scripts/
test-server/
legacy/
ai_services/
data/
*.test.js
*.test.mjs
*.test.cjs
.env
.env.*
.git/
.gitignore
`;
  fs.writeFileSync(path.join(backendOutput, '.npmignore'), npmignoreContent);
  
  log('✓ Backend packaged', 'green');
}

// Check for large unused dependencies
function checkBackendDependencies() {
  log('\n🔍 Checking backend dependencies...', 'yellow');
  
  const packageJsonPath = path.join(BUILD_CONFIG.backendSource, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('⚠️  package.json not found', 'yellow');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Known large dependencies
  const largeDeps = {
    'winston': '~500KB',
    'express': '~200KB',
    '@supabase/supabase-js': '~300KB',
    '@modelcontextprotocol/sdk': '~400KB',
  };
  
  const report = {
    totalDependencies: Object.keys(dependencies).length,
    largeDependencies: [],
    recommendations: [],
  };
  
  for (const [dep, size] of Object.entries(largeDeps)) {
    if (dependencies[dep]) {
      report.largeDependencies.push({ name: dep, estimatedSize: size });
    }
  }
  
  // Check for potentially unused dependencies
  const potentiallyUnused = [];
  const usedInCode = new Set();
  
  // Simple check: look for require/import statements
  function checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const dep of Object.keys(dependencies)) {
        if (content.includes(`require('${dep}')`) || 
            content.includes(`require("${dep}")`) ||
            content.includes(`from '${dep}'`) ||
            content.includes(`from "${dep}"`)) {
          usedInCode.add(dep);
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  function scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
          checkFile(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  scanDirectory(BUILD_CONFIG.backendSource);
  
  for (const dep of Object.keys(dependencies)) {
    if (!usedInCode.has(dep) && !dep.startsWith('@')) {
      potentiallyUnused.push(dep);
    }
  }
  
  if (potentiallyUnused.length > 0) {
    report.recommendations.push({
      type: 'unused_dependencies',
      dependencies: potentiallyUnused,
      note: 'These dependencies may be unused. Review before removing.',
    });
  }
  
  const reportDir = path.join(BUILD_CONFIG.outputDir, 'backend');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'dependency-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('✓ Dependency check complete', 'green');
  log(`  Total dependencies: ${report.totalDependencies}`, 'cyan');
  log(`  Large dependencies: ${report.largeDependencies.length}`, 'cyan');
  if (report.recommendations.length > 0) {
    log(`  ⚠️  ${report.recommendations[0].dependencies.length} potentially unused dependencies found`, 'yellow');
  }
  
  return report;
}

// Validate production environment
function validateProductionEnv() {
  log('\n✅ Validating production environment configuration...', 'yellow');
  
  const envExamplePath = path.join(rootDir, 'config', 'env.example');
  const requiredVars = [];
  
  if (fs.existsSync(envExamplePath)) {
    const content = fs.readFileSync(envExamplePath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.trim().startsWith('#') && line.includes('=')) {
        const key = line.split('=')[0].trim();
        if (key && !key.startsWith('REACT_APP_')) {
          requiredVars.push(key);
        }
      }
    }
  }
  
  const validation = {
    timestamp: new Date().toISOString(),
    requiredVariables: requiredVars,
    note: 'Set these variables in your production environment before deployment',
  };
  
  const validationDir = path.join(BUILD_CONFIG.outputDir, 'backend');
  fs.mkdirSync(validationDir, { recursive: true });
  const validationPath = path.join(validationDir, 'env-validation.json');
  fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2));
  
  log('✓ Environment validation template created', 'green');
  log(`  Required variables: ${requiredVars.length}`, 'cyan');
  
  return validation;
}

// Create deployment configuration
function createDeploymentConfig(bundleReport, dependencyReport) {
  log('\n📝 Creating deployment configuration...', 'yellow');
  
  const config = {
    buildInfo: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'production',
    },
    frontend: {
      buildDirectory: 'frontend/dist',
      totalSize: bundleReport?.totalSize || 0,
      totalSizeFormatted: bundleReport ? formatBytes(bundleReport.totalSize) : 'Unknown',
      fileCount: bundleReport?.files.length || 0,
      buildTool: 'react-scripts',
      optimizations: {
        sourceMaps: false,
        minification: true,
        treeShaking: true,
      },
    },
    backend: {
      entryPoint: 'index.js',
      nodeVersion: process.version,
      totalDependencies: dependencyReport?.totalDependencies || 0,
      largeDependencies: dependencyReport?.largeDependencies || [],
    },
    deployment: {
      frontend: {
        type: 'static',
        serveDirectory: 'frontend/dist',
        recommendedPlatform: 'Vercel, Netlify, or Cloudflare Pages',
      },
      backend: {
        type: 'node',
        startCommand: 'npm install && npm start',
        port: '5001',
        recommendedPlatform: 'Railway, Render, or AWS Elastic Beanstalk',
        environmentVariables: 'See backend/env-validation.json',
      },
    },
    notes: [
      'Frontend is a static build - serve the frontend/dist directory',
      'Backend requires Node.js environment with all dependencies installed',
      'Set all required environment variables before starting backend',
      'Backend logs are configured for production (JSON format)',
      'No source maps included in frontend build',
      'All assets are minified and optimized',
    ],
  };
  
  fs.mkdirSync(BUILD_CONFIG.outputDir, { recursive: true });
  const configPath = path.join(BUILD_CONFIG.outputDir, 'deployment_config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  log('✓ Deployment configuration created', 'green');
  
  return config;
}

// Create build notes
function createBuildNotes(bundleReport, dependencyReport, deploymentConfig) {
  log('\n📄 Creating build notes...', 'yellow');
  
  const notes = `# InvestX Labs - Production Build Notes

## Build Information

- **Build Date**: ${new Date().toISOString()}
- **Build Version**: 1.0.0
- **Node Version**: ${process.version}

## Frontend Build

### Build Configuration
- **Build Tool**: react-scripts (Create React App)
- **Output Directory**: \`frontend/dist\`
- **Source Maps**: Disabled
- **Minification**: Enabled
- **Tree Shaking**: Enabled
- **Dev Tools**: Removed

### Bundle Size
- **Total Size**: ${bundleReport ? formatBytes(bundleReport.totalSize) : 'Unknown'}
- **File Count**: ${bundleReport?.files.length || 0}

### Top 10 Largest Files
${bundleReport ? bundleReport.files.slice(0, 10).map((file, i) => 
  `${i + 1}. \`${file.path}\` - ${file.sizeFormatted}`
).join('\n') : 'N/A'}

### Deployment
The frontend is a static build that can be served by any static hosting service:
- **Recommended**: Vercel, Netlify, or Cloudflare Pages
- **Serve Directory**: \`frontend/dist\`
- **SPA Routing**: Configure your hosting service to serve \`index.html\` for all routes

## Backend Build

### Package Information
- **Entry Point**: \`index.js\`
- **Total Dependencies**: ${dependencyReport?.totalDependencies || 0}
- **Large Dependencies**: ${dependencyReport?.largeDependencies.length || 0}

### Large Dependencies
${dependencyReport ? dependencyReport.largeDependencies.map(dep => 
  `- \`${dep.name}\`: ${dep.estimatedSize}`
).join('\n') : 'N/A'}

### Removed for Production
- Dev-only scripts (nodemon, test scripts)
- Test files (\`*.test.js\`, \`*.test.mjs\`, \`*.test.cjs\`)
- Development scripts directory
- Legacy code directory
- Test server directory
- AI services Python files (not used in Node.js backend)

### Deployment
1. **Install Dependencies**: \`npm install\` (devDependencies excluded)
2. **Set Environment Variables**: See \`backend/env-validation.json\`
3. **Start Server**: \`npm start\`

### Environment Variables
Required environment variables are listed in \`backend/env-validation.json\`.
Set these in your production environment before starting the server.

### Logging
- Production logging uses Winston with JSON format
- Logs are written to \`logs/\` directory
- Error logs are rotated daily
- Console output is JSON-formatted in production

## Security Notes

1. **Environment Variables**: Never commit \`.env\` files
2. **API Keys**: Store securely in your hosting platform's environment variable system
3. **CORS**: Configure CORS settings for your production domain
4. **Rate Limiting**: Backend includes rate limiting middleware

## Next Steps

1. Review \`deployment_config.json\` for deployment details
2. Set all required environment variables
3. Deploy frontend to static hosting
4. Deploy backend to Node.js hosting platform
5. Configure CORS and API endpoints
6. Test production deployment

## Support

For issues or questions, refer to:
- \`README.md\` in project root
- \`DEPLOYMENT_INSTRUCTIONS.md\` in project root
- Environment setup guides in \`docs/\` directory
`;

  fs.mkdirSync(BUILD_CONFIG.outputDir, { recursive: true });
  const notesPath = path.join(BUILD_CONFIG.outputDir, 'BUILD_NOTES.md');
  fs.writeFileSync(notesPath, notes);
  
  log('✓ Build notes created', 'green');
}

// Main build function
async function main() {
  try {
    log('\n🚀 Starting InvestX Labs Production Build', 'bright');
    log('='.repeat(60), 'cyan');
    
    // Step 1: Clean
    cleanBuild();
    
    // Step 2: Install frontend dependencies
    installFrontendDeps();
    
    // Step 3: Build frontend
    buildFrontend();
    
    // Step 4: Generate bundle size report
    const bundleReport = generateBundleSizeReport();
    
    // Step 5: Package backend
    packageBackend();
    
    // Step 6: Check backend dependencies
    const dependencyReport = checkBackendDependencies();
    
    // Step 7: Validate production environment
    validateProductionEnv();
    
    // Step 8: Copy frontend build to production package
    log('\n📦 Copying frontend build to production package...', 'yellow');
    const frontendOutput = path.join(BUILD_CONFIG.outputDir, 'frontend');
    const frontendDist = path.join(BUILD_CONFIG.frontendSource, 'dist');
    
    if (fs.existsSync(frontendDist)) {
      fs.mkdirSync(frontendOutput, { recursive: true });
      
      // Copy all files from dist to production package
      function copyRecursive(src, dest) {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          const entries = fs.readdirSync(src);
          for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      }
      
      copyRecursive(frontendDist, frontendOutput);
      log('✓ Frontend build copied to production package', 'green');
    } else {
      throw new Error('Frontend dist directory not found after build!');
    }
    
    // Step 9: Create deployment configuration
    const deploymentConfig = createDeploymentConfig(bundleReport, dependencyReport);
    
    // Step 10: Create build notes
    createBuildNotes(bundleReport, dependencyReport, deploymentConfig);
    
    // Final summary
    log('\n' + '='.repeat(60), 'cyan');
    log('✅ Production build complete!', 'green');
    log('='.repeat(60), 'cyan');
    log(`\n📦 Production package location: ${BUILD_CONFIG.outputDir}`, 'bright');
    log(`\n📁 Package contents:`, 'bright');
    log(`   - frontend/          (Static build files)`, 'cyan');
    log(`   - backend/           (Node.js application)`, 'cyan');
    log(`   - deployment_config.json`, 'cyan');
    log(`   - BUILD_NOTES.md`, 'cyan');
    log(`\n📊 Reports:`, 'bright');
    log(`   - frontend/bundle-size-report.json`, 'cyan');
    log(`   - backend/dependency-report.json`, 'cyan');
    log(`   - backend/env-validation.json`, 'cyan');
    log(`\n🚀 Ready for deployment!`, 'green');
    
  } catch (error) {
    log(`\n❌ Build failed: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  }
}

// Run build
main();

