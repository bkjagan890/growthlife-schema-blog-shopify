import assert from 'node:assert/strict';
import {
  parseTime12,
  toUtcIso,
  fromUtcIso,
  articleState,
  validateJsonLd,
  withDefaults,
  defaultSettings,
} from '../extensions/app-home/src/lib/schema.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('  ok', name); };

console.log('time parsing');
t('reads 12-hour times', () => {
  assert.equal(parseTime12('10:00', 'AM'), 600);
  assert.equal(parseTime12('12:00', 'AM'), 0);
  assert.equal(parseTime12('12:30', 'PM'), 750);
  assert.equal(parseTime12('6:05', 'PM'), 18 * 60 + 5);
});

t('rejects impossible times', () => {
  assert.equal(parseTime12('13:00', 'PM'), null);
  assert.equal(parseTime12('0:30', 'AM'), null);
  assert.equal(parseTime12('10:75', 'AM'), null);
  assert.equal(parseTime12('', 'AM'), null);
  assert.equal(parseTime12('nonsense', 'AM'), null);
});

console.log('timezone conversion');
t('turns shop-local wall clock into a UTC instant', () => {
  // India is UTC+5:30, so 6:00 PM local is 12:30 UTC the same day.
  assert.equal(toUtcIso('2026-09-10', '06:00', 'PM', 330), '2026-09-10T12:30:00.000Z');
  // A morning slot in a zone behind UTC lands on the same date, later in the day.
  assert.equal(toUtcIso('2026-09-10', '09:00', 'AM', -300), '2026-09-10T14:00:00.000Z');
});

t('crosses midnight correctly in both directions', () => {
  // 1:00 AM in India is the previous day in UTC.
  assert.equal(toUtcIso('2026-09-10', '01:00', 'AM', 330), '2026-09-09T19:30:00.000Z');
  // 11:00 PM in a zone behind UTC spills into the next UTC day.
  assert.equal(toUtcIso('2026-09-10', '11:00', 'PM', -300), '2026-09-11T04:00:00.000Z');
});

t('refuses bad input instead of guessing', () => {
  assert.equal(toUtcIso('10-09-2026', '06:00', 'PM', 330), null);
  assert.equal(toUtcIso('2026-09-10', '25:00', 'PM', 330), null);
  assert.equal(toUtcIso('', '06:00', 'PM', 330), null);
});

t('round-trips back to the same wall clock', () => {
  const iso = toUtcIso('2026-09-10', '06:00', 'PM', 330);
  const back = fromUtcIso(iso, 330);
  assert.equal(back.date, '2026-09-10');
  assert.equal(back.time, '06:00');
  assert.equal(back.ampm, 'PM');
  assert.equal(back.label, '10 Sep 2026 · 06:00 PM');
});

console.log('article state');
t('separates draft, scheduled and published', () => {
  const now = Date.parse('2026-09-10T00:00:00Z');
  assert.equal(articleState({publishedAt: null}, now), 'draft');
  assert.equal(articleState({publishedAt: '2026-09-11T00:00:00Z'}, now), 'scheduled');
  assert.equal(articleState({publishedAt: '2026-09-09T00:00:00Z'}, now), 'published');
});

console.log('json-ld validation');
t('accepts sound markup and names the type', () => {
  const result = validateJsonLd(
    JSON.stringify({'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: []}),
  );
  assert.equal(result.ok, true);
  assert.equal(result.type, 'FAQPage');
});

t('catches broken json before it reaches a storefront', () => {
  const result = validateJsonLd('{"@type": "Product",}');
  assert.equal(result.ok, false);
  assert.ok(result.issues[0].startsWith('Not valid JSON'));
});

t('flags what a product is missing', () => {
  const result = validateJsonLd(JSON.stringify({'@context': 'x', '@type': 'Product'}));
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues, ['Product needs a name', 'Product needs offers']);
});

console.log('settings');
t('fills gaps from defaults without losing saved values', () => {
  const merged = withDefaults({org_name: 'Implemental', product_enabled: false}, {name: 'Shop'});
  assert.equal(merged.org_name, 'Implemental');
  assert.equal(merged.product_enabled, false);
  assert.equal(merged.return_days, defaultSettings().return_days);
  assert.equal(merged.breadcrumb_enabled, true);
});

t('survives a corrupt stored value', () => {
  assert.deepEqual(withDefaults(null, {name: 'Shop'}).org_name, 'Shop');
  assert.deepEqual(withDefaults('broken', {name: 'Shop'}).org_name, 'Shop');
});

console.log(`\n${pass} checks passed`);
