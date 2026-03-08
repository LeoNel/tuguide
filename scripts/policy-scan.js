const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const ignoreDirs = new Set(['.git', 'node_modules', 'dist']);
const ignoreFiles = new Set(['scripts/policy-scan.js']);
const textExtensions = new Set([
  '.js',
  '.json',
  '.html',
  '.css',
  '.md',
  '.yml',
  '.yaml'
]);

const findings = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!textExtensions.has(ext)) {
      continue;
    }

    const relPath = path.relative(root, fullPath);
    if (ignoreFiles.has(relPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    if (/http:\/\//i.test(content)) {
      findings.push(`${relPath}: contains prohibited http:// URL`);
    }

    if (ext === '.html' && /<[^>]+\son[a-z]+\s*=\s*["']/i.test(content)) {
      findings.push(
        `${relPath}: contains prohibited inline event handler attribute`
      );
    }

    if (/\beval\s*\(/i.test(content)) {
      findings.push(`${relPath}: contains prohibited eval()`);
    }

    if (/\bnew\s+Function\s*\(/i.test(content)) {
      findings.push(`${relPath}: contains prohibited new Function()`);
    }

    if (
      ext === '.html' &&
      /<script[^>]+src\s*=\s*["']https?:\/\//i.test(content)
    ) {
      findings.push(`${relPath}: contains prohibited remote script source`);
    }
  }
}

walk(root);

if (findings.length > 0) {
  console.error('Security/policy scan failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Security/policy scan passed.');
