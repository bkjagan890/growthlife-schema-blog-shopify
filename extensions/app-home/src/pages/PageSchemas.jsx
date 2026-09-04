import {useEffect, useState} from 'preact/hooks';
import {loadContext, saveSettings} from '../lib/settings.js';
import {validateJsonLd} from '../lib/schema.js';
import {ErrorBanner, Loading} from '../components.jsx';

const TEMPLATES = {
  FAQPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Your question here?',
        acceptedAnswer: {'@type': 'Answer', text: 'Your answer here.'},
      },
    ],
  },
  AboutPage: {'@context': 'https://schema.org', '@type': 'AboutPage', name: 'About us'},
  ContactPage: {'@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact us'},
  WebPage: {'@context': 'https://schema.org', '@type': 'WebPage', name: 'Page title'},
};

export default function PageSchemas() {
  const [context, setContext] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await loadContext();
        setContext(ctx);
        setRows(
          (ctx.settings.page_schemas || []).map((row) => ({
            handle: row.handle || '',
            json: JSON.stringify(row.data || {}, null, 2),
          })),
        );
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  if (!context) {
    return (
      <s-page heading="Page schema">
        <s-section>{error ? <ErrorBanner error={error} /> : <Loading />}</s-section>
      </s-page>
    );
  }

  const patch = (index, key, value) => {
    setSaved(false);
    setRows((prev) => prev.map((row, i) => (i === index ? {...row, [key]: value} : row)));
  };

  const add = (type) => {
    setSaved(false);
    setRows((prev) => [...prev, {handle: '', json: JSON.stringify(TEMPLATES[type], null, 2)}]);
  };

  const remove = (index) => {
    setSaved(false);
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const clean = rows.filter((row) => row.handle.trim() && row.json.trim());
      const broken = clean.find((row) => !validateJsonLd(row.json).ok);
      if (broken) {
        setError(`Fix the JSON for "${broken.handle}" before saving.`);
        return;
      }
      // Stored parsed, not as text, so the theme can re-serialise it safely
      // instead of pasting a merchant-supplied string into the page.
      const stored = clean.map((row) => ({handle: row.handle.trim(), data: JSON.parse(row.json)}));
      await saveSettings(context.installationId, {...context.settings, page_schemas: stored});
      setRows(clean);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <s-page heading="Page schema">
      <s-button slot="primary-action" variant="primary" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </s-button>

      <ErrorBanner error={error} onDismiss={() => setError('')} />
      {saved ? (
        <s-section>
          <s-banner tone="success">
            <s-paragraph>Saved.</s-paragraph>
          </s-banner>
        </s-section>
      ) : null}

      <s-section heading="Markup for individual pages">
        <s-paragraph>
          Match a page by its handle — the last part of its URL, so /pages/faq is just "faq" — and
          the JSON below is written into that page's head, exactly as you type it. Everything is
          checked before saving, so a stray comma can't reach your storefront.
        </s-paragraph>
        <s-stack direction="inline" gap="small-200">
          {Object.keys(TEMPLATES).map((type) => (
            <s-button key={type} onClick={() => add(type)}>Add {type}</s-button>
          ))}
        </s-stack>
      </s-section>

      {rows.length ? (
        rows.map((row, index) => {
          const check = validateJsonLd(row.json);
          return (
            <s-section key={index} heading={row.handle || 'New page'}>
              <s-text-field
                label="Page handle"
                value={row.handle}
                details="From the URL: /pages/faq is faq"
                onInput={(e) => patch(index, 'handle', e.currentTarget.value.trim())}
              />
              <s-text-area
                label="JSON-LD"
                value={row.json}
                onInput={(e) => patch(index, 'json', e.currentTarget.value)}
              />
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-text color={check.ok ? 'subdued' : 'critical'}>
                  {check.ok ? `Valid — ${check.type}` : check.issues.join(' · ')}
                </s-text>
                <s-button tone="critical" onClick={() => remove(index)}>Remove</s-button>
              </s-stack>
            </s-section>
          );
        })
      ) : (
        <s-section>
          <s-paragraph>Nothing added yet. Pick a template above to start.</s-paragraph>
        </s-section>
      )}
    </s-page>
  );
}
