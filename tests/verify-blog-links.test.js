import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHtml } from '../src/verify-blog-links.mjs';

const target = 'https://www.unitconv.top';

test('identifies a public followed link', () => {
  const result = analyzeHtml('<html><title>Test</title><a href="https://unitconv.top/">Unit Converter</a></html>', 'https://example.com/post', target);
  assert.equal(result.status, 'live_followed');
  assert.equal(result.evidence.anchor_text, 'Unit Converter');
});

test('identifies nofollow and ugc links', () => {
  const result = analyzeHtml('<a rel="ugc nofollow" href="https://www.unitconv.top">Tool</a>', 'https://example.com/post', target);
  assert.equal(result.status, 'live_nofollow');
  assert.deepEqual(result.evidence.rel, ['ugc', 'nofollow']);
});

test('does not treat an unrelated mention as a live link', () => {
  const result = analyzeHtml('<p>Visit unitconv.top sometime.</p>', 'https://example.com/post', target);
  assert.equal(result.status, 'target_text_only');
});
