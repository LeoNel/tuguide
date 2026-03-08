const assert = require('node:assert/strict');
const { scanContent, ALLOWLIST_MARKER } = require('../scripts/policy-scan.js');

const sinkName = 'inner' + 'HTML';
const sinkPayload = `element.${sinkName} = value;`;
assert.ok(
  scanContent('sample.js', '.js', sinkPayload).some((finding) =>
    finding.includes('DOM sink')
  )
);

const scriptWord = 'scr' + 'ipt';
const scriptPayload = `const node = document.createElement('${scriptWord}');`;
assert.ok(
  scanContent('sample.js', '.js', scriptPayload).some((finding) =>
    finding.includes('dynamic script element creation')
  )
);

const nodeName = 'scr' + 'iptNode';
const injectionPayload = `document.head.appendChild(${nodeName});`;
assert.ok(
  scanContent('sample.js', '.js', injectionPayload).some((finding) =>
    finding.includes('dynamic script node injection pattern')
  )
);

assert.equal(
  scanContent(
    'safe.js',
    '.js',
    `element.${sinkName} = value; // ${ALLOWLIST_MARKER}`
  ).length,
  0
);

console.log('policy scan tests passed');
