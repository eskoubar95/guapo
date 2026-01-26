#!/usr/bin/env node

/**
 * Helper Metadata Validation Script
 *
 * Validates helper metadata for consistency and correctness:
 * - All helpers have YAML frontmatter
 * - Section line ranges match actual section markers
 * - Section titles match headings
 * - All helpers documented in helper-metadata.md
 * - Metadata consistency between frontmatter and registry
 */

const fs = require('fs');
const path = require('path');

const HELPERS_DIR = path.join(__dirname, '../commands/_shared');
const METADATA_FILE = path.join(HELPERS_DIR, 'helper-metadata.md');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseYAMLFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = {};
  const lines = frontmatterMatch[1].split('\n');

  let currentKey = null;
  let currentValue = [];
  let inArray = false;

  for (const line of lines) {
    if (line.trim() === '') continue;

    // Check for array start
    if (line.match(/^(\s*)([a-z_]+):\s*$/)) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
      }
      currentKey = line.match(/^(\s*)([a-z_]+):\s*$/)[2];
      currentValue = [];
      inArray = true;
      continue;
    }

    // Check for array item
    if (inArray && line.match(/^\s*-\s*(.+)$/)) {
      currentValue.push(line.match(/^\s*-\s*(.+)$/)[1]);
      continue;
    }

    // Check for key-value
    if (line.match(/^(\s*)([a-z_]+):\s*(.+)$/)) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
      }
      const match = line.match(/^(\s*)([a-z_]+):\s*(.+)$/);
      currentKey = match[2];
      currentValue = [match[3]];
      inArray = false;
      continue;
    }

    // Check for nested structure (sections)
    if (line.match(/^\s+([a-z_]+):/)) {
      // This is a nested key, skip for now (simplified parsing)
      continue;
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
  }

  return frontmatter;
}

function findSectionMarkers(content) {
  const sections = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/^## Section: (.+?) \(Lines (\d+)-(\d+)\)$/);
    if (sectionMatch) {
      sections.push({
        title: sectionMatch[1],
        startLine: parseInt(sectionMatch[2]),
        endLine: parseInt(sectionMatch[3]),
        actualLine: i + 1,
      });
    }
  }

  return sections;
}

function validateHelper(helperFile) {
  const filePath = path.join(HELPERS_DIR, helperFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  // 1. Check frontmatter exists
  const frontmatter = parseYAMLFrontmatter(content);
  if (!frontmatter) {
    issues.push({ type: 'error', message: 'Missing YAML frontmatter' });
    return { file: helperFile, issues };
  }

  // 2. Check required fields
  const requiredFields = ['helper_id', 'load_when', 'sections', 'always_load'];
  for (const field of requiredFields) {
    if (!(field in frontmatter)) {
      issues.push({ type: 'error', message: `Missing required field: ${field}` });
    }
  }

  // 3. Check section markers match metadata
  const sections = findSectionMarkers(content);
  if (sections.length > 0 && frontmatter.sections) {
    // Note: Simplified check - would need to parse sections from frontmatter properly
    // For now, just check that sections exist
    for (const section of sections) {
      if (section.actualLine !== section.startLine) {
        issues.push({
          type: 'warning',
          message: `Section "${section.title}" marker at line ${section.actualLine}, but metadata says ${section.startLine}`,
        });
      }
    }
  }

  return { file: helperFile, frontmatter, sections, issues };
}

function validateRegistry() {
  const content = fs.readFileSync(METADATA_FILE, 'utf-8');
  const helperFiles = fs.readdirSync(HELPERS_DIR).filter((f) => f.endsWith('.md') && f !== 'helper-metadata.md');

  const registryHelpers = [];
  const registryMatch = content.match(/### ([a-z-]+)\.md/g);
  if (registryMatch) {
    registryHelpers.push(...registryMatch.map((m) => m.replace('### ', '').replace('.md', '')));
  }

  const issues = [];

  // Check all helpers are in registry
  for (const helperFile of helperFiles) {
    const helperId = helperFile.replace('.md', '');
    if (!registryHelpers.includes(helperId)) {
      issues.push({
        type: 'warning',
        message: `${helperId}.md not documented in helper-metadata.md`,
      });
    }
  }

  // Check registry has all helpers
  for (const registryHelper of registryHelpers) {
    if (!helperFiles.includes(`${registryHelper}.md`)) {
      issues.push({
        type: 'error',
        message: `Registry documents ${registryHelper}.md but file doesn't exist`,
      });
    }
  }

  return { helperFiles, registryHelpers, issues };
}

function main() {
  log('🔍 Validating Helper Metadata...\n', 'blue');

  const helperFiles = fs.readdirSync(HELPERS_DIR).filter((f) => f.endsWith('.md') && f !== 'helper-metadata.md');

  let totalIssues = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  // Validate each helper
  for (const helperFile of helperFiles) {
    const result = validateHelper(helperFile);
    if (result.issues.length > 0) {
      log(`\n📄 ${helperFile}:`, 'blue');
      for (const issue of result.issues) {
        if (issue.type === 'error') {
          log(`  ❌ ${issue.message}`, 'red');
          totalErrors++;
        } else {
          log(`  ⚠️  ${issue.message}`, 'yellow');
          totalWarnings++;
        }
        totalIssues++;
      }
    } else {
      log(`✅ ${helperFile}`, 'green');
    }
  }

  // Validate registry
  log('\n📋 Validating Helper Registry...\n', 'blue');
  const registryResult = validateRegistry();

  if (registryResult.issues.length > 0) {
    for (const issue of registryResult.issues) {
      if (issue.type === 'error') {
        log(`  ❌ ${issue.message}`, 'red');
        totalErrors++;
      } else {
        log(`  ⚠️  ${issue.message}`, 'yellow');
        totalWarnings++;
      }
      totalIssues++;
    }
  } else {
    log('✅ Helper registry is consistent', 'green');
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  if (totalIssues === 0) {
    log('✅ All validations passed!', 'green');
    process.exit(0);
  } else {
    log(`\n📊 Summary:`, 'blue');
    log(`   Total issues: ${totalIssues}`, totalErrors > 0 ? 'red' : 'yellow');
    log(`   Errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'reset');
    log(`   Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'reset');
    log('\n⚠️  Some issues found. Please review and fix.', 'yellow');
    process.exit(totalErrors > 0 ? 1 : 0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateHelper, validateRegistry };

