import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/components/LlmGatewayPanel.jsx', import.meta.url), 'utf8');

test('standalone gateway uses the AI-DEMO2 console regions', () => {
  for (const region of ['aria-label="Lanes"', 'aria-label="Conversation"', 'aria-label="Last decision"']) {
    assert.match(source, new RegExp(region.replace(/["\\]/g, '\\$&')));
  }
});

test('standalone gateway keeps the comparison controls from AI-DEMO2', () => {
  assert.match(source, /None — enter a prompt manually/);
  assert.match(source, /Compare local models/);
  assert.match(source, /Through Privilege/);
  assert.match(source, /no policy layer/);
});
