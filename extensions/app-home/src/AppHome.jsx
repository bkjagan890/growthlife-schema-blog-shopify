import {render} from 'preact';
import {LocationProvider, ErrorBoundary, Router, Route} from 'preact-iso';

import Dashboard from './pages/Dashboard.jsx';
import SchemaSettings from './pages/SchemaSettings.jsx';
import LocalBusiness from './pages/LocalBusiness.jsx';
import PageSchemas from './pages/PageSchemas.jsx';
import BlogScheduler from './pages/BlogScheduler.jsx';
import NotFound from './pages/NotFound.jsx';

export default async () => {
  render(<App />, document.body);
};

function App() {
  return (
    <LocationProvider>
      <s-app-nav>
        <s-link href="/">Dashboard</s-link>
        <s-link href="/schema">Schema Settings</s-link>
        <s-link href="/local">Local Business</s-link>
        <s-link href="/pages">Page Schema</s-link>
        <s-link href="/blog">Blog Scheduler</s-link>
      </s-app-nav>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={Dashboard} />
          <Route path="/schema" component={SchemaSettings} />
          <Route path="/local" component={LocalBusiness} />
          <Route path="/pages" component={PageSchemas} />
          <Route path="/blog" component={BlogScheduler} />
          <Route default component={NotFound} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
