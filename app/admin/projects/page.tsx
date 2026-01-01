import { getProjects } from '@/app/actions'
import ProjectManager from '@/components/admin/ProjectManager'

export default async function ProjectsPage() {
    const projects = await getProjects()

    return (
        <div>
            <h1 className="text-3xl font-bold mb-10 text-khaki-500">Manage Projects</h1>
            <ProjectManager initialProjects={projects} />
        </div>
    )
}
