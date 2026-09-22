import { SITE_URL } from '@/lib/site';

// Server-safe breadcrumb schema (no client JS). Render inside any page:
// <BreadcrumbsJsonLd items={[{ name: 'Home', path: '/' }, ...]} />
export default function BreadcrumbsJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
