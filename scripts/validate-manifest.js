const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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
  failures.push('minimum_chrome_version must be a major version string like "116"');
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
}

if (
  Array.isArray(manifest.host_permissions) &&
  manifest.host_permissions.some(
    (value) => typeof value !== 'string' || !value.startsWith('https://')
  )
) {
  failures.push('host_permissions entries must be https:// URLs');
}

const extensionCsp =
  manifest.content_security_policy &&
  manifest.content_security_policy.extension_pages;

if (typeof extensionCsp !== 'string') {
  failures.push('content_security_policy.extension_pages must be a string');
} else {
  if (!/script-src\s+'self'/.test(extensionCsp)) {
    failures.push("CSP must contain script-src 'self'");
  }

  if (/connect-src\s+https:\s*;/.test(extensionCsp)) {
    failures.push('CSP connect-src must not allow all https origins');
  }
}

if (failures.length > 0) {
  console.error('Manifest schema validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Manifest schema validation passed.');
