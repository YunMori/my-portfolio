import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/', // Prohibit crawling of admin pages
        },
        sitemap: 'https://my-portfolio.com/sitemap.xml', // Update with actual domain later
    };
}
