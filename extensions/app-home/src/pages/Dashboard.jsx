import {useEffect, useState} from 'preact/hooks';
import {loadContext} from '../lib/settings.js';
import {listArticles} from '../lib/blog.js';
import {articleState} from '../lib/schema.js';
import {ErrorBanner, Loading, StatCard} from '../components.jsx';

export default function Dashboard() {
  const [context, setContext] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await loadContext();
        setContext(ctx);
        setArticles(await listArticles({max: 500}));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <s-page heading="GrowthLife Schema & Blog">
        <s-section>
          <Loading label="Reading your store" />
        </s-section>
      </s-page>
    );
  }

  const settings = (context && context.settings) || {};
  const on = [
    settings.organization_enabled && 'Organization',
    settings.product_enabled && 'Product',
    settings.article_enabled && 'Blog post',
    settings.collection_enabled && 'Collection',
    settings.breadcrumb_enabled && 'Breadcrumb',
    settings.local_enabled && 'Local business',
  ].filter(Boolean);

  const scheduled = articles.filter((article) => articleState(article) === 'scheduled').length;
  const drafts = articles.filter((article) => articleState(article) === 'draft').length;

  return (
    <s-page heading="GrowthLife Schema & Blog">
      <ErrorBanner error={error} onDismiss={() => setError('')} />

      <s-section heading="Overview">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <StatCard label="Schema types on" value={String(on.length)} hint={on.join(', ') || 'None yet'} />
          <StatCard label="Posts scheduled" value={String(scheduled)} hint="Waiting to go live" />
          <StatCard label="Drafts" value={String(drafts)} hint="Not published or scheduled" />
          <StatCard
            label="Settings saved"
            value={context && context.everSaved ? 'Yes' : 'Not yet'}
            hint={context ? context.site.timezone : ''}
          />
        </s-grid>
      </s-section>

      {context && !context.everSaved ? (
        <s-section>
          <s-banner tone="warning" heading="Save your settings once to switch the schema on">
            <s-paragraph>
              Until Schema settings are saved, the storefront has nothing to read and no markup is
              added. Open Schema settings, check the details and press Save.
            </s-paragraph>
          </s-banner>
        </s-section>
      ) : null}

      <s-section heading="One step happens outside this app">
        <s-paragraph>
          Shopify keeps app embeds switched off until a merchant turns them on. Go to{' '}
          <s-link href="shopify://admin/themes">Online Store → Themes</s-link>, press Customize, open
          the App embeds panel on the left, and switch on <s-text>GrowthLife Schema</s-text>. Without
          that, everything here saves correctly but nothing reaches your pages.
        </s-paragraph>
      </s-section>

      <s-section heading="What each screen does">
        <s-unordered-list>
          <s-list-item>
            <s-text>Schema settings</s-text> — who you are, and the shipping, returns and condition
            details that go inside every product offer.
          </s-list-item>
          <s-list-item>
            <s-text>Local business</s-text> — address, map and opening hours, for stores with a
            physical presence.
          </s-list-item>
          <s-list-item>
            <s-text>Page schema</s-text> — hand-written JSON-LD for individual pages: FAQ, About,
            Contact, anything Google supports.
          </s-list-item>
          <s-list-item>
            <s-text>Blog scheduler</s-text> — pick a date and time in your own timezone; Shopify
            publishes the post itself when the moment arrives.
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}
