const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_PERMISSIONS = ['contextMenus'];
const APPROVED_HOST_PERMISSIONS = [
  'https://news.temple.edu/rss/news/topics/campus-news'
];
const REQUIRED_CSP_DIRECTIVES = {
  'script-src': "'self'",
  'object-src': "'none'",
  'base-uri': "'none'",
  'form-action': "'none'",
  'connect-src': 'https://news.temple.edu/rss/news/topics/campus-news'
};

function parseCsp(csp) {
  const directives = new Map();
  for (const chunk of csp.split(';')) {
    const part = chunk.trim();
    if (!part) {
      continue;
    }
    const [name, ...values] = part.split(/\s+/);
    directives.set(name, values.join(' '));
  }
  return directives;
}

function validateManifest(manifest) {
  const failures = [];

  function requireField(field) {
    if (!(field in manifest)) {
      failures.push(`Missing required field: ${field}`);
    }
  }

  for (const field of [
    'manifest_version',
    'name',
    'version',
    'description',
    'background',
    'action',
    'permissions',
    'minimum_chrome_version',
    'content_security_policy'
  ]) {
    requireField(field);
  }

  if (manifest.manifest_version !== 3) {
    failures.push('manifest_version must be 3');
  }

  if (!/^\d+\.\d+(\.\d+)?$/.test(manifest.version || '')) {
    failures.push('version must be semantic-looking format like 1.0 or 1.0.0');
  }

  if (!/^\d+$/.test(manifest.minimum_chrome_version || '')) {
    failures.push(
      'minimum_chrome_version must be a major version string like "116"'
    );
  }

  if (
    !manifest.background ||
    typeof manifest.background.service_worker !== 'string'
  ) {
    failures.push('background.service_worker must be a string');
  }

  if (!manifest.action || typeof manifest.action.default_popup !== 'string') {
    failures.push('action.default_popup must be a string');
  }

  if (!Array.isArray(manifest.permissions)) {
    failures.push('permissions must be an array');
  } else {
    const actualPermissions = [...manifest.permissions].sort();
    const expectedPermissions = [...EXPECTED_PERMISSIONS].sort();

    if (
      JSON.stringify(actualPermissions) !== JSON.stringify(expectedPermissions)
    ) {
      failures.push(
        `permissions must exactly match least-privilege baseline: ${expectedPermissions.join(', ')}`
      );
    }
  }

  if (!Array.isArray(manifest.host_permissions)) {
    failures.push('host_permissions must be an array');
  } else {
    const wildcardPermission = manifest.host_permissions.find(
      (value) =>
        typeof value !== 'string' ||
        value.includes('*') ||
        /\/\*$/.test(value) ||
        /:\/\/\*\./.test(value)
    );

    if (wildcardPermission) {
      failures.push(
        `host_permissions contains wildcard or invalid entry: ${wildcardPermission}`
      );
    }

    const actualHosts = [...manifest.host_permissions].sort();
    const expectedHosts = [...APPROVED_HOST_PERMISSIONS].sort();
    if (JSON.stringify(actualHosts) !== JSON.stringify(expectedHosts)) {
      failures.push(
        `host_permissions must exactly match approved scope: ${expectedHosts.join(', ')}`
      );
    }
  }

  const extensionCsp =
    manifest.content_security_policy &&
    manifest.content_security_policy.extension_pages;

  if (typeof extensionCsp !== 'string') {
    failures.push('content_security_policy.extension_pages must be a string');
  } else {
    if (/unsafe-inline|unsafe-eval/i.test(extensionCsp)) {
      failures.push('CSP must not contain unsafe-inline or unsafe-eval');
    }

    const directives = parseCsp(extensionCsp);
    for (const [directive, expected] of Object.entries(
      REQUIRED_CSP_DIRECTIVES
    )) {
      if (directives.get(directive) !== expected) {
        failures.push(
          `CSP directive ${directive} must be exactly: ${expected}`
        );
      }
    }
  }

  return failures;
}

function loadManifest() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

if (require.main === module) {
  const failures = validateManifest(loadManifest());

  if (failures.length > 0) {
    console.error('Manifest schema validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Manifest schema validation passed.');
}

module.exports = {
  validateManifest,
  parseCsp,
  EXPECTED_PERMISSIONS,
  APPROVED_HOST_PERMISSIONS,
  REQUIRED_CSP_DIRECTIVES
};
