#!/usr/bin/env node

/**
 * Static Content Emoji Transformation Script
 * 
 * This script removes emoji characters from static content files including:
 * - HTML files
 * - Markdown files
 * - JSON files (copy/content files)
 * 
 * Usage:
 *   node scripts/transform-static-content.js [--dry-run] [--backup]
 * 
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --backup     Create backup files before modifying
 */

const fs = require('fs');
const path = require('path');

// Import the stripEmojis function logic (Node.js compatible version)
function stripEmojis(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // Modern approach: Use Unicode property escapes (ES2018+)
    const emojiRegex = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
    
    try {
      const testRegex = new RegExp('\\p{Extended_Pictographic}', 'u');
      testRegex.test('test');
      return text.replace(emojiRegex, '');
    } catch (e) {
      return stripEmojisFallback(text);
    }
  } catch (error) {
    return stripEmojisFallback(text);
  }
}

function stripEmojisFallback(text) {
  const emojiRanges = [
    /[\u{1F600}-\u{1F64F}]/gu,
    /[\u{1F300}-\u{1F5FF}]/gu,
    /[\u{1F900}-\u{1F9FF}]/gu,
    /[\u{1F680}-\u{1F6FF}]/gu,
    /[\u{1FA00}-\u{1FAFF}]/gu,
    /[\u{2700}-\u{27BF}]/gu,
    /[\u{2600}-\u{26FF}]/gu,
    /[\u{FE00}-\u{FE0F}]/gu,
    /[\u{20D0}-\u{20FF}]/gu,
    /\u{200D}/gu,
    /[\u{20E3}]/gu,
    /[\u{1F1E0}-\u{1F1FF}]/gu,
    /[\u{E0020}-\u{E007F}]/gu,
    /[\u{1F3FB}-\u{1F3FF}]/gu,
  ];

  let result = text;
  for (const range of emojiRanges) {
    result = result.replace(range, '');
  }
  return result;
}

// File patterns to process
const FILE_PATTERNS = {
  html: /\.html?$/i,
  markdown: /\.md$/i,
  json: /\.json$/i,
};

// Directories to search (relative to project root)
const SEARCH_DIRECTORIES = [
  'frontend/public',
  'frontend/src',
  'docs',
  'backend/public', // if exists
];

// Directories/files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git/,
  /build/,
  /dist/,
  /coverage/,
  /package-lock\.json/,
  /\.map$/, // Source maps
];

/**
 * Check if a file should be processed
 */
function shouldProcessFile(filePath) {
  // Check skip patterns
  if (SKIP_PATTERNS.some(pattern => pattern.test(filePath))) {
    return false;
  }

  // Check if file matches our patterns
  const ext = path.extname(filePath).toLowerCase();
  return Object.values(FILE_PATTERNS).some(pattern => pattern.test(ext));
}

/**
 * Recursively find all files matching patterns
 */
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Process a single file
 */
function processFile(filePath, options = {}) {
  const { dryRun = false, backup = false } = options;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const sanitized = stripEmojis(content);

    // Check if content changed
    if (content === sanitized) {
      return { changed: false, filePath };
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would modify: ${filePath}`);
      return { changed: true, filePath, dryRun: true };
    }

    // Create backup if requested
    if (backup) {
      const backupPath = `${filePath}.emoji-backup`;
      fs.writeFileSync(backupPath, content, 'utf8');
      console.log(`[BACKUP] Created: ${backupPath}`);
    }

    // Write sanitized content
    fs.writeFileSync(filePath, sanitized, 'utf8');
    return { changed: true, filePath };

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { changed: false, filePath, error: error.message };
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const backup = args.includes('--backup');

  console.log('🔍 Scanning for static content files...\n');

  const projectRoot = path.resolve(__dirname, '..');
  const allFiles = [];

  // Find all files in search directories
  SEARCH_DIRECTORIES.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    const files = findFiles(fullPath);
    allFiles.push(...files);
  });

  console.log(`Found ${allFiles.length} files to process\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  const results = {
    processed: 0,
    changed: 0,
    errors: 0,
  };

  // Process each file
  allFiles.forEach(filePath => {
    const result = processFile(filePath, { dryRun, backup });
    results.processed++;

    if (result.error) {
      results.errors++;
    } else if (result.changed) {
      results.changed++;
      if (!dryRun) {
        console.log(`✅ Modified: ${filePath}`);
      }
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`  Files processed: ${results.processed}`);
  console.log(`  Files changed: ${results.changed}`);
  console.log(`  Errors: ${results.errors}`);

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. Use without --dry-run to apply changes.');
  } else if (backup) {
    console.log('\n💾 Backups created with .emoji-backup extension');
  }

  console.log('='.repeat(50));
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { stripEmojis, processFile, findFiles };

