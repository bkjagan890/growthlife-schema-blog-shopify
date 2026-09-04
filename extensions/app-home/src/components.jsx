export function ErrorBanner({error, onDismiss}) {
  if (!error) return null;
  return (
    <s-banner tone="critical" heading="Something went wrong" dismissible onDismiss={onDismiss}>
      <s-paragraph>{error}</s-paragraph>
    </s-banner>
  );
}

export function Loading({label = 'Loading'}) {
  return (
    <s-stack direction="inline" gap="small-200" alignItems="center">
      <s-spinner size="small" accessibilityLabel={label} />
      <s-text color="subdued">{label}…</s-text>
    </s-stack>
  );
}

export function StatCard({label, value, hint}) {
  return (
    <s-box padding="base" borderRadius="base" border="base">
      <s-stack gap="small-500">
        <s-text color="subdued">{label}</s-text>
        <s-heading>{value}</s-heading>
        {hint ? <s-text color="subdued">{hint}</s-text> : null}
      </s-stack>
    </s-box>
  );
}

export function EmptyState({heading, children}) {
  return (
    <s-section>
      <s-stack gap="small-200">
        <s-heading>{heading}</s-heading>
        {children ? <s-paragraph>{children}</s-paragraph> : null}
      </s-stack>
    </s-section>
  );
}

export function Saved({at}) {
  if (!at) return null;
  return (
    <s-banner tone="success">
      <s-paragraph>Saved. The storefront picks this up on the next page load.</s-paragraph>
    </s-banner>
  );
}
