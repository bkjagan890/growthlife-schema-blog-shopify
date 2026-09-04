import {gql, assertNoUserErrors, collect} from './gql.js';

const BLOGS = `#graphql
  query Blogs { blogs(first: 50) { nodes { id title handle } } }`;

const ARTICLES = `#graphql
  query Articles($cursor: String, $query: String) {
    articles(first: 50, after: $cursor, query: $query, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        isPublished
        publishedAt
        blog { id title }
        image { url }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`;

const ARTICLE_UPDATE = `#graphql
  mutation ScheduleArticle($id: ID!, $article: ArticleUpdateInput!) {
    articleUpdate(id: $id, article: $article) {
      article { id title isPublished publishedAt }
      userErrors { field message }
    }
  }`;

export async function listBlogs() {
  return (await gql(BLOGS)).blogs.nodes;
}

export async function listArticles({max = 500, query = null, onProgress} = {}) {
  const nodes = await collect(
    async (cursor) => (await gql(ARTICLES, {cursor, query})).articles,
    {max, onProgress},
  );
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    isPublished: node.isPublished,
    publishedAt: node.publishedAt,
    blogTitle: (node.blog && node.blog.title) || '',
    image: (node.image && node.image.url) || '',
  }));
}

/** Hand Shopify the moment to go live — it does the publishing itself. */
export async function scheduleArticle(id, publishDateIso) {
  const data = await gql(ARTICLE_UPDATE, {
    id,
    article: {isPublished: true, publishDate: publishDateIso},
  });
  return assertNoUserErrors(data.articleUpdate, 'Schedule article').article;
}

export async function publishNow(id) {
  const data = await gql(ARTICLE_UPDATE, {
    id,
    article: {isPublished: true, publishDate: new Date().toISOString()},
  });
  return assertNoUserErrors(data.articleUpdate, 'Publish article').article;
}

export async function unpublish(id) {
  const data = await gql(ARTICLE_UPDATE, {id, article: {isPublished: false}});
  return assertNoUserErrors(data.articleUpdate, 'Unpublish article').article;
}
