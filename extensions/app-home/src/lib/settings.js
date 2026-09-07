import {gql, assertNoUserErrors} from './gql.js';
import {withDefaults} from './schema.js';

/**
 * Settings live in an app-owned metafield on this app's own installation.
 * That matters: the theme app extension reads exactly the same metafield as
 * `app.metafields.settings.schema`, so what the merchant saves here is what the
 * storefront renders, with nothing in between and no extra access scopes.
 */
const NAMESPACE = 'settings';
const KEY = 'schema';

const SHOP_AND_SETTINGS = `#graphql
  query ShopAndSettings {
    shop {
      name
      url: myshopifyDomain
      primaryDomain { url }
      ianaTimezone
      timezoneOffsetMinutes
      currencyCode
    }
    currentAppInstallation {
      id
            metafield(namespace: "settings", key: "schema") { value }
    }
  }`;

const SAVE_SETTINGS = `#graphql
  mutation SaveSettings($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id updatedAt }
      userErrors { field message }
    }
  }`;

export async function loadContext() {
  const data = await gql(SHOP_AND_SETTINGS);
  const shop = data.shop || {};
  const installation = data.currentAppInstallation || {};
  const raw = installation.metafield && installation.metafield.value;

  let stored = null;
  if (raw) {
    try {
      stored = JSON.parse(raw);
    } catch (error) {
      stored = null;
    }
  }

  const site = {
    name: shop.name || '',
    url: (shop.primaryDomain && shop.primaryDomain.url) || `https://${shop.url}`,
    timezone: shop.ianaTimezone || 'UTC',
    offsetMinutes: Number(shop.timezoneOffsetMinutes) || 0,
    currency: shop.currencyCode || '',
  };

  return {
    site,
    installationId: installation.id,
    settings: withDefaults(stored, site),
    everSaved: Boolean(raw),
  };
}

export async function saveSettings(installationId, settings) {
  const data = await gql(SAVE_SETTINGS, {
    metafields: [
      {
        ownerId: installationId,
        namespace: NAMESPACE,
        key: KEY,
        type: 'json',
        value: JSON.stringify(settings),
      },
    ],
  });
  return assertNoUserErrors(data.metafieldsSet, 'Save settings');
}
