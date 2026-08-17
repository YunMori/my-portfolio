import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/utils/url';
import { getPostSummaries } from '@/app/actions/posts';
import { getProjectSummaries } from '@/app/actions/projects';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getBaseUrl();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: `${baseUrl}/#about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/#projects`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    const posts = await getPostSummaries();
    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
        lastModified: post.created_at ? new Date(post.created_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
    }));

    // 프로젝트 케이스 스터디. 홈의 #projects 프래그먼트만으로는 개별 상세가 색인되지 않는다.
    const projects = await getProjectSummaries();
    const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
        url: `${baseUrl}/projects/${encodeURIComponent(project.slug)}`,
        lastModified: project.created_at ? new Date(project.created_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [...staticRoutes, ...projectRoutes, ...postRoutes];
}
