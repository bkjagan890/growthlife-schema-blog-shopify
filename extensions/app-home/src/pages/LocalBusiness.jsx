import {useEffect, useState} from 'preact/hooks';
import {loadContext, saveSettings} from '../lib/settings.js';
import {LOCAL_TYPES} from '../lib/schema.js';
import {ErrorBanner, Loading} from '../components.jsx';

export default function LocalBusiness() {
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
      <s-page heading="Local business">
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

  return (
    <s-page heading="Local business">
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

      <s-section heading="Physical presence">
        <s-paragraph>
          Only switch this on if the business really has an address customers could visit. Local
          business markup on a shop with no premises is the kind of thing Google penalises rather
          than rewards.
        </s-paragraph>
        <s-checkbox
          label="Add local business markup to every page"
          checked={form.local_enabled}
          onChange={(e) => set('local_enabled', e.currentTarget.checked)}
        />
      </s-section>

      {form.local_enabled ? (
        <>
          <s-section heading="The business">
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
              <s-select label="Business type" value={form.local_type} onChange={(e) => set('local_type', e.currentTarget.value)}>
                {LOCAL_TYPES.map((value) => (
                  <s-option key={value} value={value}>{value}</s-option>
                ))}
              </s-select>
              <s-text-field label="Name" value={form.local_name} details="Leave blank to use the business name" onInput={(e) => set('local_name', e.currentTarget.value)} />
              <s-text-field label="Price range" value={form.price_range} details="For example ₹₹" onInput={(e) => set('price_range', e.currentTarget.value)} />
              <s-text-field label="Opening hours" value={form.opening_hours} details="Mo-Sa 10:00-19:00" onInput={(e) => set('opening_hours', e.currentTarget.value)} />
            </s-grid>
          </s-section>

          <s-section heading="Address">
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
              <s-text-field label="Street" value={form.address_street} onInput={(e) => set('address_street', e.currentTarget.value)} />
              <s-text-field label="City" value={form.address_city} onInput={(e) => set('address_city', e.currentTarget.value)} />
              <s-text-field label="State or region" value={form.address_region} onInput={(e) => set('address_region', e.currentTarget.value)} />
              <s-text-field label="Postcode" value={form.address_postcode} onInput={(e) => set('address_postcode', e.currentTarget.value)} />
              <s-text-field label="Country code" value={form.address_country} onInput={(e) => set('address_country', e.currentTarget.value.toUpperCase())} />
            </s-grid>
          </s-section>

          <s-section heading="On the map">
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
              <s-text-field label="Latitude" value={form.latitude} onInput={(e) => set('latitude', e.currentTarget.value)} />
              <s-text-field label="Longitude" value={form.longitude} onInput={(e) => set('longitude', e.currentTarget.value)} />
              <s-text-field label="Google Maps link" value={form.map_url} onInput={(e) => set('map_url', e.currentTarget.value)} />
            </s-grid>
          </s-section>
        </>
      ) : null}
    </s-page>
  );
}
