// Page-level openGraph settings replace the layout's, so every page spreads these in to keep the share image and site name.
export const OG_DEFAULTS = {
  type: 'website' as const,
  siteName: 'Handysolver',
  locale: 'en_IN',
  images: [{ url: '/og-cover.png', width: 1200, height: 630, alt: 'Handysolver, Ideas into impact' }],
};
