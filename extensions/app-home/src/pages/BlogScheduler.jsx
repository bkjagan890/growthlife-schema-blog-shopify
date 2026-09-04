import {useEffect, useState} from 'preact/hooks';
import {loadContext} from '../lib/settings.js';
import {listArticles, scheduleArticle, publishNow, unpublish} from '../lib/blog.js';
import {articleState, toUtcIso, fromUtcIso} from '../lib/schema.js';
import {ErrorBanner, Loading, EmptyState} from '../components.jsx';

const FILTERS = [
  {key: 'all', label: 'All'},
  {key: 'scheduled', label: 'Scheduled'},
  {key: 'draft', label: 'Drafts'},
  {key: 'published', label: 'Published'},
];

export default function BlogScheduler() {
  const [site, setSite] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [ampm, setAmpm] = useState('AM');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const refresh = async () => {
    setArticles(await listArticles({max: 500}));
  };

  useEffect(() => {
    (async () => {
      try {
        const ctx = await loadContext();
        setSite(ctx.site);
        await refresh();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <s-page heading="Blog scheduler">
        <s-section>
          <Loading label="Reading your blog posts" />
        </s-section>
      </s-page>
    );
  }

  const offset = site ? site.offsetMinutes : 0;
  const shown = articles.filter((article) => filter === 'all' || articleState(article) === filter);

  const openEditor = (article) => {
    const existing = fromUtcIso(article.publishedAt, offset);
    const now = fromUtcIso(new Date().toISOString(), offset);
    setEditing(article);
    setDate((existing && existing.date) || (now && now.date) || '');
    setTime((existing && existing.time) || '10:00');
    setAmpm((existing && existing.ampm) || 'AM');
    setNote('');
    setError('');
  };

  const run = async (label, action) => {
    setBusy(label);
    setError('');
    try {
      await action();
      await refresh();
      setEditing(null);
      shopify.toast.show(label);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const confirmSchedule = () => {
    const iso = toUtcIso(date, time, ampm, offset);
    if (!iso) {
      setNote('Give a date and a time like 09:30.');
      return;
    }
    if (new Date(iso).getTime() <= Date.now()) {
      setNote('That moment has already passed — pick a later one.');
      return;
    }
    run('Scheduled', () => scheduleArticle(editing.id, iso));
  };

  return (
    <s-page heading="Blog scheduler">
      <s-button slot="secondary-actions" disabled={Boolean(busy)} onClick={() => run('Refreshed', refresh)}>
        Refresh
      </s-button>

      <ErrorBanner error={error} onDismiss={() => setError('')} />

      <s-section heading="How this works">
        <s-paragraph>
          Pick a moment in {site ? site.timezone : 'your timezone'} and Shopify publishes the post
          itself when it arrives — nothing needs to stay open and this app does not need to be
          running. Times below are shown in that same timezone.
        </s-paragraph>
        <s-stack direction="inline" gap="small-200">
          {FILTERS.map((option) => (
            <s-button
              key={option.key}
              variant={filter === option.key ? 'primary' : 'secondary'}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </s-button>
          ))}
        </s-stack>
      </s-section>

      {editing ? (
        <s-section heading={`Schedule: ${editing.title}`}>
          <s-grid gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap="base">
            <s-text-field label="Publish date" value={date} details="YYYY-MM-DD" onInput={(e) => setDate(e.currentTarget.value.trim())} />
            <s-text-field label="Time" value={time} details="hh:mm" onInput={(e) => setTime(e.currentTarget.value.trim())} />
            <s-select label="AM / PM" value={ampm} onChange={(e) => setAmpm(e.currentTarget.value)}>
              <s-option value="AM">AM</s-option>
              <s-option value="PM">PM</s-option>
            </s-select>
          </s-grid>
          {note ? <s-text color="critical">{note}</s-text> : null}
          <s-stack direction="inline" gap="small-200">
            <s-button variant="primary" disabled={Boolean(busy)} onClick={confirmSchedule}>
              {busy || 'Schedule'}
            </s-button>
            <s-button disabled={Boolean(busy)} onClick={() => setEditing(null)}>Cancel</s-button>
          </s-stack>
        </s-section>
      ) : null}

      <s-section heading={`Posts (${shown.length})`}>
        {shown.length ? (
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header listSlot="primary">Post</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Goes live</s-table-header>
              <s-table-header />
            </s-table-header-row>
            <s-table-body>
              {shown.map((article) => {
                const state = articleState(article);
                const when = fromUtcIso(article.publishedAt, offset);
                return (
                  <s-table-row key={article.id}>
                    <s-table-cell>
                      <s-stack direction="inline" gap="small-200" alignItems="center">
                        {article.image ? <s-thumbnail src={article.image} alt={article.title} size="small" /> : null}
                        <s-stack gap="small-500">
                          <s-text>{article.title}</s-text>
                          <s-text color="subdued">{article.blogTitle}</s-text>
                        </s-stack>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={state === 'scheduled' ? 'info' : state === 'published' ? 'success' : 'neutral'}>
                        {state}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>{when ? when.label : '—'}</s-table-cell>
                    <s-table-cell>
                      <s-stack direction="inline" gap="small-500">
                        <s-button disabled={Boolean(busy)} onClick={() => openEditor(article)}>
                          {state === 'scheduled' ? 'Re-schedule' : 'Schedule'}
                        </s-button>
                        {state !== 'published' ? (
                          <s-button disabled={Boolean(busy)} onClick={() => run('Published', () => publishNow(article.id))}>
                            Publish now
                          </s-button>
                        ) : null}
                        {state !== 'draft' ? (
                          <s-button disabled={Boolean(busy)} onClick={() => run('Unpublished', () => unpublish(article.id))}>
                            Unpublish
                          </s-button>
                        ) : null}
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        ) : (
          <EmptyState heading="Nothing here">
            No posts match this filter.
          </EmptyState>
        )}
      </s-section>
    </s-page>
  );
}
