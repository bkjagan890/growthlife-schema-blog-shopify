import {useEffect, useState} from 'preact/hooks';
import {loadContext, saveSettings} from '../lib/settings.js';
import {CONDITIONS, RETURN_METHODS, RETURN_FEES} from '../lib/schema.js';
import {ErrorBanner, Loading} from '../components.jsx';

export default function SchemaSettings() {
  const [context, setContext] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await loadContext();
        setContext(ctx);
        setForm(ctx.settings);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  if (!form) {
    return (
      <s-page heading="Schema settings">
        <s-section>{error ? <ErrorBanner error={error} /> : <Loading />}</s-section>
      </s-page>
    );
  }

  const set = (key, value) => {
    setSaved(false);
    setForm((prev) => ({...prev, [key]: value}));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await saveSettings(context.installationId, form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const socials = (form.social_profiles || []).join('\n');

  return (
    <s-page heading="Schema settings">
      <s-button slot="primary-action" variant="primary" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </s-button>

      <ErrorBanner error={error} onDismiss={() => setError('')} />
      {saved ? (
        <s-section>
          <s-banner tone="success">
            <s-paragraph>Saved. Your storefront picks this up on the next page load.</s-paragraph>
          </s-banner>
        </s-section>
      ) : null}

      <s-section heading="What to output">
        <s-paragraph>
          Most themes already write their own Product and Breadcrumb markup. Two copies of the same
          type on one page is untidy, so switch off anything your theme already handles — view a
          product page's source and search for "application/ld+json" to check.
        </s-paragraph>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(210px, 1fr))" gap="base">
          <s-checkbox label="Organization and website" checked={form.organization_enabled} onChange={(e) => set('organization_enabled', e.currentTarget.checked)} />
          <s-checkbox label="Product" checked={form.product_enabled} onChange={(e) => set('product_enabled', e.currentTarget.checked)} />
          <s-checkbox label="Blog post" checked={form.article_enabled} onChange={(e) => set('article_enabled', e.currentTarget.checked)} />
          <s-checkbox label="Collection" checked={form.collection_enabled} onChange={(e) => set('collection_enabled', e.currentTarget.checked)} />
          <s-checkbox label="Breadcrumb" checked={form.breadcrumb_enabled} onChange={(e) => set('breadcrumb_enabled', e.currentTarget.checked)} />
        </s-grid>
      </s-section>

      <s-section heading="Who you are">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(230px, 1fr))" gap="base">
          <s-text-field label="Business name" value={form.org_name} onInput={(e) => set('org_name', e.currentTarget.value)} />
          <s-text-field label="Website" value={form.org_url} details="No trailing slash" onInput={(e) => set('org_url', e.currentTarget.value)} />
          <s-text-field label="Logo URL" value={form.org_logo} onInput={(e) => set('org_logo', e.currentTarget.value)} />
          <s-text-field label="Phone" value={form.phone} onInput={(e) => set('phone', e.currentTarget.value)} />
          <s-text-field label="Email" value={form.email} onInput={(e) => set('email', e.currentTarget.value)} />
          <s-text-field label="GST number" value={form.gst_number} details="Added as an identifier" onInput={(e) => set('gst_number', e.currentTarget.value)} />
        </s-grid>
        <s-text-area
          label="Short description"
          value={form.org_description}
          onInput={(e) => set('org_description', e.currentTarget.value)}
        />
        <s-text-area
          label="Social profile links"
          details="One per line — these become sameAs"
          value={socials}
          onInput={(e) =>
            set(
              'social_profiles',
              e.currentTarget.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
            )
          }
        />
      </s-section>

      <s-section heading="Inside every product offer">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(210px, 1fr))" gap="base">
          <s-select label="Item condition" value={form.item_condition} onChange={(e) => set('item_condition', e.currentTarget.value)}>
            {CONDITIONS.map((value) => (
              <s-option key={value} value={value}>{value.replace('Condition', '')}</s-option>
            ))}
          </s-select>
          <s-text-field label="Ships to (country code)" value={form.ship_country} onInput={(e) => set('ship_country', e.currentTarget.value.toUpperCase())} />
          <s-checkbox label="Include shipping details" checked={form.shipping_enabled} onChange={(e) => set('shipping_enabled', e.currentTarget.checked)} />
          <s-checkbox label="Include return policy" checked={form.returns_enabled} onChange={(e) => set('returns_enabled', e.currentTarget.checked)} />
        </s-grid>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap="base">
          <s-text-field label="Shipping rate" value={String(form.shipping_rate)} details="0 for free" onInput={(e) => set('shipping_rate', e.currentTarget.value)} />
          <s-number-field label="Handling days (min)" value={String(form.handling_min)} onChange={(e) => set('handling_min', Number(e.currentTarget.value) || 0)} />
          <s-number-field label="Handling days (max)" value={String(form.handling_max)} onChange={(e) => set('handling_max', Number(e.currentTarget.value) || 0)} />
          <s-number-field label="Transit days (min)" value={String(form.transit_min)} onChange={(e) => set('transit_min', Number(e.currentTarget.value) || 0)} />
          <s-number-field label="Transit days (max)" value={String(form.transit_max)} onChange={(e) => set('transit_max', Number(e.currentTarget.value) || 0)} />
          <s-number-field label="Return window (days)" value={String(form.return_days)} onChange={(e) => set('return_days', Number(e.currentTarget.value) || 0)} />
          <s-select label="Return method" value={form.return_method} onChange={(e) => set('return_method', e.currentTarget.value)}>
            {RETURN_METHODS.map((value) => (
              <s-option key={value} value={value}>{value.replace('Return', 'Return ')}</s-option>
            ))}
          </s-select>
          <s-select label="Return fees" value={form.return_fees} onChange={(e) => set('return_fees', e.currentTarget.value)}>
            {RETURN_FEES.map((value) => (
              <s-option key={value} value={value}>{value}</s-option>
            ))}
          </s-select>
        </s-grid>
      </s-section>

      <s-section heading="Star ratings">
        <s-paragraph>
          Ratings are only added when your review app stores them on the product. Point these at the
          metafield it writes — Shopify's own review data sits in reviews.rating and
          reviews.rating_count. Wrong values here simply mean no rating is output, never a wrong one.
        </s-paragraph>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-text-field label="Rating namespace" value={form.rating_namespace} onInput={(e) => set('rating_namespace', e.currentTarget.value)} />
          <s-text-field label="Rating key" value={form.rating_key} onInput={(e) => set('rating_key', e.currentTarget.value)} />
          <s-text-field label="Count namespace" value={form.rating_count_namespace} onInput={(e) => set('rating_count_namespace', e.currentTarget.value)} />
          <s-text-field label="Count key" value={form.rating_count_key} onInput={(e) => set('rating_count_key', e.currentTarget.value)} />
        </s-grid>
      </s-section>
    </s-page>
  );
}
