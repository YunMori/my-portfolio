import { getProjects } from '@/app/actions/projects';
import { computeTechStats } from '@/utils/projects';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import TechStack from '@/components/home/TechStack';
import Projects from '@/components/home/Projects';
import SocialProof from '@/components/home/SocialProof';
import Footer from '@/components/layout/Footer';
import ScrollProgress from '@/components/behavior/ScrollProgress';
import ScrollReveal from '@/components/behavior/ScrollReveal';
import PageViewTracker from '@/components/behavior/PageViewTracker';

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
