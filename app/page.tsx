import { getProjects } from '@/app/actions';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  // Fetch real data from Supabase
  const projects = await getProjects();

  return (
    <HomeClient
      initialProjects={projects}
    />
  );
}