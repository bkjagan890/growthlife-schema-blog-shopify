# GrowthLife Schema & Blog — Shopify app

A port of the GrowthLife Blog Scheduler & Auto Schema WordPress plugin to Shopify.
There is no licence key, no activation and no server: Shopify hosts both halves of
the app.

App: `GrowthLife Schema & Blog` · Client ID `879d6b174af02d2fbbd82fcc844a3823`
Organisation: Implemental · Target store: `implemental-2`

## The two halves

**Admin UI** — an App Home UI extension. Settings, page-level JSON-LD and the blog
scheduler live here. Everything it saves goes into one app-owned metafield.

**Theme app extension** — an app embed block with `target: "head"`. It reads that
same metafield as `app.metafields.settings.schema` and writes the JSON-LD into
every storefront page. Because the settings are app-owned, nothing sits between
the admin screen and the storefront, and no extra access scopes are needed.

> App embeds are switched off until a merchant turns them on. After installing,
> go to **Online Store → Themes → Customize → App embeds** and enable
> **GrowthLife Schema**.

## Screens

| Screen | What it does |
| --- | --- |
| Dashboard | What's switched on, how many posts are scheduled, and the one step that happens outside the app. |
| Schema settings | Organisation details, GST, socials, and the shipping / returns / condition data that goes inside every product offer. Each schema type has its own toggle. |
| Local business | Address, geo, opening hours and map link, for shops with a real address. |
| Page schema | Hand-written JSON-LD matched to a page handle, validated before it can be saved. |
| Blog scheduler | Pick a date and time in the shop's own timezone; Shopify publishes the post itself. |

## How the WordPress features map

| WordPress | Shopify | Notes |
| --- | --- | --- |
| `wp_head` JSON-LD injection | Theme app extension, `target: "head"` | Real head output, no theme edits. |
| Product schema from WooCommerce | Liquid `product` object | Offers, shipping, returns, GST identifier, condition, ratings from a configurable metafield. |
| Page schema (FAQ / About / Contact) | Page schema screen | Matched by page handle, validated before saving. |
| Local business | Local business screen | Same fields. |
| Blog scheduling via WP cron | `articleUpdate(publishDate:)` | Shopify publishes on its own — nothing has to stay running. |
| Licence / trial system | Removed | As requested. |
| Options table | One app-owned metafield | Read directly by the theme extension. |

Two honest notes: most themes already emit their own Product and Breadcrumb
markup, which is why every type here is a toggle you can switch off; and star
ratings only appear when a review app actually stores them on the product, so the
rating metafield is configurable and simply outputs nothing when it is empty.

## Tests

```bash
node test/pure.test.mjs    # time parsing, timezone maths, validation, settings merge
node test/gql.test.mjs     # every GraphQL document parses and is uniquely named
node test/theme.test.mjs   # the Liquid block: tag balance, escaping, head target, size
npx shopify app build
```

## Access scopes

`write_content` for blogs and articles, `read_products` for the admin previews,
`read_themes` to check the storefront. Settings need no scope at all — an app can
always write its own metafields.
