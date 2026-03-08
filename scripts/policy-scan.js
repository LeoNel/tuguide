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
const ALLOWLIST_MARKER = 'policy-scan: allow';

const rules = [
  { regex: /http:\/\//i, message: 'contains prohibited http:// URL' },
  {
    regex: /<[^>]+\son[a-z]+\s*=\s*["']/i,
    message: 'contains prohibited inline event handler attribute',
    htmlOnly: true
  },
  { regex: /\beval\s*\(/i, message: 'contains prohibited eval()' },
  {
    regex: /\bnew\s+Function\s*\(/i,
    message: 'contains prohibited new Function()'
  },
  {
    regex: /<script[^>]+src\s*=\s*["']https?:\/\//i,
    message: 'contains prohibited remote script source',
    htmlOnly: true
  },
  {
    regex: /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b/,
    message: 'contains risky HTML DOM sink usage',
    extensions: new Set(['.js', '.html'])
  },
  {
    regex: /createElement\s*\(\s*["']script["']\s*\)/i,
    message: 'contains dynamic script element creation',
    extensions: new Set(['.js', '.html'])
  },
  {
    regex: /(appendChild|insertBefore|replaceChild)\s*\(\s*[^)]*script[^)]*\)/i,
    message: 'contains dynamic script node injection pattern',
    extensions: new Set(['.js', '.html'])
  }
];

function isAllowlisted(content, index) {
  const lineStart = content.lastIndexOf('\n', index) + 1;
  const lineEnd = content.indexOf('\n', index);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return line.includes(ALLOWLIST_MARKER);
}

function scanContent(relPath, ext, content) {
  const findings = [];

  for (const rule of rules) {
    if (rule.htmlOnly && ext !== '.html') {
      continue;
    }

    if (rule.extensions && !rule.extensions.has(ext)) {
      continue;
    }

    for (const match of content.matchAll(
      new RegExp(
        rule.regex.source,
        rule.regex.flags.includes('g')
          ? rule.regex.flags
          : `${rule.regex.flags}g`
      )
    )) {
      if (isAllowlisted(content, match.index ?? 0)) {
        continue;
      }
      findings.push(`${relPath}: ${rule.message}`);
      break;
    }
  }

  return findings;
}

function scanPolicy(basePath = root) {
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

      const relPath = path.relative(basePath, fullPath);
      if (ignoreFiles.has(relPath)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      findings.push(...scanContent(relPath, ext, content));
    }
  }

  walk(basePath);
  return findings;
}

if (require.main === module) {
  const findings = scanPolicy();
  if (findings.length > 0) {
    console.error('Security/policy scan failed:');
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log('Security/policy scan passed.');
}

module.exports = {
  scanPolicy,
  scanContent,
  ALLOWLIST_MARKER
};
