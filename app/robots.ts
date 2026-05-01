import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://ayaanfaisal.com/sitemap.xml',
    host: 'https://ayaanfaisal.com',
  };
}
