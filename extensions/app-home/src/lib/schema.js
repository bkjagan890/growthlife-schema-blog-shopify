/**
 * Pure helpers behind the schema and scheduling screens.
 *
 * Everything here runs without the Admin API so it can be unit tested, and
 * without Intl, which the extension sandbox does not reliably provide — the
 * timezone maths works off the offset the shop itself reports.
 */

export const RETURN_METHODS = ['ReturnByMail', 'ReturnInStore', 'ReturnAtKiosk'];
export const RETURN_FEES = ['FreeReturn', 'ReturnShippingFees', 'RestockingFees'];
export const CONDITIONS = ['NewCondition', 'UsedCondition', 'RefurbishedCondition', 'DamagedCondition'];
export const LOCAL_TYPES = [
  'LocalBusiness',
  'Store',
  'HomeGoodsStore',
  'HardwareStore',
  'ClothingStore',
  'ElectronicsStore',
  'Restaurant',
  'ProfessionalService',
];

export function defaultSettings(shop = {}) {
  return {
    organization_enabled: true,
    product_enabled: true,
    article_enabled: true,
    collection_enabled: true,
    breadcrumb_enabled: true,
    local_enabled: false,
    shipping_enabled: true,
    returns_enabled: true,

    org_name: shop.name || '',
    org_url: (shop.url || '').replace(/\/+$/, ''),
    org_logo: '',
    org_description: '',
    gst_number: '',
    phone: '',
    email: '',
    social_profiles: [],

    item_condition: 'NewCondition',
    ship_country: 'IN',
    shipping_rate: '0',
    handling_min: 1,
    handling_max: 2,
    transit_min: 3,
    transit_max: 7,
    return_days: 7,
    return_method: 'ReturnByMail',
    return_fees: 'FreeReturn',

    rating_namespace: 'reviews',
    rating_key: 'rating',
    rating_count_namespace: 'reviews',
    rating_count_key: 'rating_count',

    local_type: 'LocalBusiness',
    local_name: '',
    address_street: '',
    address_city: '',
    address_region: '',
    address_postcode: '',
    address_country: 'IN',
    latitude: '',
    longitude: '',
    opening_hours: 'Mo-Sa 10:00-19:00',
    price_range: '₹₹',
    map_url: '',

    page_schemas: [],
  };
}

/** Merge stored settings over the defaults so new keys always have a value. */
export function withDefaults(stored, shop) {
  const base = defaultSettings(shop);
  if (!stored || typeof stored !== 'object') return base;
  return {...base, ...stored};
}

const TWELVE_HOUR = /^(\d{1,2}):(\d{2})$/;

/** `10:30` + `PM` -> minutes since midnight, or null when the input is nonsense. */
export function parseTime12(time, ampm) {
  const match = TWELVE_HOUR.exec(String(time || '').trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  const meridiem = String(ampm || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * A wall-clock date and time in the shop's timezone -> an ISO instant in UTC.
 * `offsetMinutes` is what the shop reports for itself, e.g. 330 for IST.
 */
export function toUtcIso(date, time, ampm, offsetMinutes = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return null;
  const minutes = parseTime12(time, ampm);
  if (minutes === null) return null;
  const [year, month, day] = date.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day, 0, minutes - offsetMinutes, 0);
  return new Date(utc).toISOString();
}

/** The other direction, for showing a stored UTC instant back to the merchant. */
export function fromUtcIso(iso, offsetMinutes = 0) {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const shifted = new Date(at.getTime() + offsetMinutes * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  let hours = shifted.getUTCHours();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(hours)}:${pad(shifted.getUTCMinutes())}`,
    ampm: meridiem,
    label: `${shifted.getUTCDate()} ${MONTHS[shifted.getUTCMonth()]} ${shifted.getUTCFullYear()} · ${pad(hours)}:${pad(shifted.getUTCMinutes())} ${meridiem}`,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Where an article stands right now, from its publish fields. */
export function articleState(article, now = Date.now()) {
  if (!article.publishedAt) return 'draft';
  const at = new Date(article.publishedAt).getTime();
  if (Number.isNaN(at)) return 'draft';
  return at > now ? 'scheduled' : 'published';
}

/** Read a pasted JSON-LD block and report what is wrong with it. */
export function validateJsonLd(raw) {
  const text = String(raw || '').trim();
  if (!text) return {ok: false, type: '', issues: ['Nothing to check']};
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {ok: false, type: '', issues: [`Not valid JSON — ${error.message}`]};
  }
  const issues = [];
  const node = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!node || typeof node !== 'object') return {ok: false, type: '', issues: ['Not an object']};
  if (!node['@context']) issues.push('@context missing');
  const type = node['@type'] || (node['@graph'] ? 'graph' : '');
  if (!type) issues.push('@type missing');
  if (type === 'Product') {
    if (!node.name) issues.push('Product needs a name');
    if (!node.offers) issues.push('Product needs offers');
  }
  if (type === 'FAQPage' && !node.mainEntity) issues.push('FAQPage needs mainEntity');
  return {ok: issues.length === 0, type: String(type), issues};
}
