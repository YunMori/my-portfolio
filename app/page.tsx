import { getProjects } from '@/app/actions';
import { computeTechStats } from '@/utils/projects';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import SocialProof from '@/components/SocialProof';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import ScrollReveal from '@/components/ScrollReveal';
import PageViewTracker from '@/components/PageViewTracker';

export default async function Home() {
  const projects = await getProjects();
  const techStats = computeTechStats(projects);

  return (
    <main className="min-h-screen selection:bg-green-900 selection:text-green-400 pb-0">
      <ScrollProgress />
      <ScrollReveal />
      <PageViewTracker />
      <Navbar />
      <Hero />
      <div className="section-divider" />
      <TechStack techStats={techStats} totalProjects={projects.length} />
      <div className="section-divider" />
      <Projects projects={projects} />
      <div className="section-divider" />
      <SocialProof totalProjects={projects.length} totalTech={techStats.length} />
      <Footer />
    </main>
  );
}
