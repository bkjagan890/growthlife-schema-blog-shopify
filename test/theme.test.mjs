import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

/**
 * The theme block is the only part of this app that runs on a live storefront,
 * where a stray tag or a broken schema tag means every page renders wrong. None
 * of that shows up in a JavaScript test suite, so it is checked here directly.
 */
const file = 'extensions/schema-theme/blocks/growthlife-schema.liquid';
const src = readFileSync(file, 'utf8');

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('  ok', name); };

console.log('theme block');

t('declares an app embed that renders in the head', () => {
  const match = /\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/.exec(src);
  assert.ok(match, 'no {% schema %} tag found');
  const schema = JSON.parse(match[1]);
  assert.equal(schema.target, 'head');
  assert.ok(schema.name);
});

t('opens and closes every tag', () => {
  const count = (re) => (src.match(re) || []).length;
  assert.equal(count(/\{%-?\s*if\s/g), count(/\{%-?\s*endif\s*-?%\}/g), 'if / endif mismatch');
  assert.equal(count(/\{%-?\s*for\s/g), count(/\{%-?\s*endfor\s*-?%\}/g), 'for / endfor mismatch');
  assert.equal(count(/\{%-?\s*case\s/g), count(/\{%-?\s*endcase\s*-?%\}/g), 'case / endcase mismatch');
  assert.equal(count(/\{%-?\s*liquid\s/g) >= 1, true);
  assert.equal(count(/\{%-?\s*comment\s*-?%\}/g), count(/\{%-?\s*endcomment\s*-?%\}/g));
});

t('reads its settings from the app metafield, not from theme settings', () => {
  assert.ok(src.includes('app.metafields.settings.schema.value'));
});

t('escapes every merchant-supplied value it prints', () => {
  // Anything interpolated straight into JSON must go through the json filter,
  // or one apostrophe in a business name breaks the whole block.
  const interpolations = src.match(/\{\{[^}]+\}\}/g) || [];
  const unescaped = interpolations.filter((tag) => {
    if (/\|\s*json\s*\}\}/.test(tag)) return false;
    // Bare numbers and loop counters are written as numbers on purpose.
    return !/(forloop\.index|products_count|handling_|transit_|return_days)/.test(tag);
  });
  assert.deepEqual(unescaped, [], `not escaped: ${unescaped.join(', ')}`);
});

t('guards each schema type behind its own toggle', () => {
  for (const flag of [
    'organization_enabled',
    'product_enabled',
    'article_enabled',
    'collection_enabled',
    'breadcrumb_enabled',
    'local_enabled',
  ]) {
    assert.ok(src.includes(flag), `${flag} is never checked`);
  }
});

t('stays well inside the liquid size limit', () => {
  assert.ok(src.length < 100 * 1024, 'over the 100 KB liquid budget');
});

console.log(`\n${pass} checks passed`);
