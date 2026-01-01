import { getProjects, getProfile } from '@/app/actions';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  // Fetch real data from Supabase
  const projects = await getProjects();
  const profile = await getProfile();

  return (
    <HomeClient
      initialProjects={projects}
      profile={profile}
    />
  );
}