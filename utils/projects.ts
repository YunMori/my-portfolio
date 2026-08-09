import { Project } from '@/types/database.types';

export type TechStat = { name: string; count: number };

/**
 * How often each technology appears across the projects, most-used first.
 * Drives both the tech stack grid and the "Technologies" figure in the stats row.
 */
export function computeTechStats(projects: Project[]): TechStat[] {
    const counts = new Map<string, number>();

    for (const project of projects) {
        for (const tech of project.stack) {
            counts.set(tech, (counts.get(tech) ?? 0) + 1);
        }
    }

    return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
