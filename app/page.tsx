import { getProjects } from '@/app/actions';
import { getPublicResumeData } from '@/app/actions/resume';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  // 프로젝트와 공개 이력 데이터를 병렬로 조회
  const [projects, resumeData] = await Promise.all([
    getProjects(),
    getPublicResumeData(),
  ]);

  return (
    <HomeClient
      initialProjects={projects}
      resumeData={resumeData}
    />
  );
}
