import { getProjects, getBlogPosts } from '@/app/actions';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  const [projects, blogPosts] = await Promise.all([
    getProjects(),
    getBlogPosts(),
  ]);

  return (
    <HomeClient
      initialProjects={projects}
      initialBlogPosts={blogPosts}
    />
  );
}
