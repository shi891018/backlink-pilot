import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseSiteHtml, buildSearchQueries, extractSearchResultUrls } from '../src/discover/similar.js';

const fixture = `
  <html><head><title>Acme AI Tool Directory</title><script src="https://assets.website-files.com/webflow.js"></script></head>
  <body><a href="/submit-a-tool">Submit your tool</a><iframe src="https://form.typeform.com/to/abc"></iframe></body></html>`;

test('analyseSiteHtml extracts directory and technical fingerprints', () => {
  const result = analyseSiteHtml(fixture, 'https://acme.example/');
  assert.deepEqual(result.technologies, ['webflow']);
  assert.deepEqual(result.formProviders, ['typeform']);
  assert.equal(result.submitLinks[0].url, 'https://acme.example/submit-a-tool');
  assert.ok(result.directoryScore >= 5);
});

test('buildSearchQueries uses detected technology and form provider', () => {
  const queries = buildSearchQueries({ technologies: ['webflow'], formProviders: ['typeform'] });
  assert.ok(queries.some(query => query.includes('webflow')));
  assert.ok(queries.some(query => query.includes('typeform')));
});

test('extractSearchResultUrls unwraps DuckDuckGo redirect URLs', () => {
  const html = '<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fdirectory.example%2Fsubmit">Result</a>';
  assert.deepEqual(extractSearchResultUrls(html), ['https://directory.example/submit']);
});
