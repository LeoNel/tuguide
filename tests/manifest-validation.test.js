const assert = require('node:assert/strict');
const {
  validateManifest,
  EXPECTED_PERMISSIONS,
  APPROVED_HOST_PERMISSIONS
} = require('../scripts/validate-manifest.js');

const baseline = {
  manifest_version: 3,
  name: 'TU Guide',
  version: '1.0.0',
  minimum_chrome_version: '116',
  description: 'desc',
  background: { service_worker: 'background.js' },
  action: { default_popup: 'news.html' },
  permissions: EXPECTED_PERMISSIONS,
  host_permissions: APPROVED_HOST_PERMISSIONS,
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src https://news.temple.edu/rss/news/topics/campus-news;"
  }
};

assert.deepEqual(validateManifest(baseline), []);

const withUnsafeInline = {
  ...baseline,
  content_security_policy: {
    extension_pages: "script-src 'self' 'unsafe-inline'; object-src 'none';"
  }
};
assert.ok(
  validateManifest(withUnsafeInline).some((x) => x.includes('unsafe-inline'))
);

const withWildcardHost = {
  ...baseline,
  host_permissions: ['https://news.temple.edu/*']
};
assert.ok(
  validateManifest(withWildcardHost).some((x) => x.includes('wildcard'))
);

const withExtraPermission = {
  ...baseline,
  permissions: ['contextMenus', 'tabs']
};
assert.ok(
  validateManifest(withExtraPermission).some((x) =>
    x.includes('least-privilege baseline')
  )
);

console.log('manifest validation tests passed');
