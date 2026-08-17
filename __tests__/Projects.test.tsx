import { render, screen } from '@testing-library/react';
import Projects from '@/components/home/Projects';
import { ContentLanguageProvider } from '@/i18n/ContentLanguage';
import type { ProjectCard } from '@/app/actions/projects';

// The real provider rather than a mock: jsdom's navigator.language is en-US and
// localStorage is empty, so it settles on 'en' — the same path a first-time
// visitor takes. Tests that need Korean write the preference first.
function renderProjects(projects: ProjectCard[]) {
    return render(
        <ContentLanguageProvider>
            <Projects projects={projects} />
        </ContentLanguageProvider>
    );
}

const mockProjects: ProjectCard[] = [
    {
        id: 'proj-1',
        slug: 'my-project',
        title: 'My Project',
        title_en: null,
        description: 'A cool project',
        description_en: null,
        stack: ['React', 'TypeScript'],
        date: '2026.01',
    },
];

// Korean original with an English translation on every text column.
const translatedProject: ProjectCard[] = [
    {
        id: 'proj-2',
        slug: 'translated-project',
        title: '내 프로젝트',
        title_en: 'Translated Project',
        description: '멋진 프로젝트',
        description_en: 'A translated description',
        stack: ['React'],
        date: '2026.02',
    },
];

beforeEach(() => {
    localStorage.clear();
});

describe('Projects', () => {
    it('renders project cards', () => {
        renderProjects(mockProjects);
        expect(screen.getByText('My Project')).toBeInTheDocument();
    });

    it('renders filter buttons for each tech', () => {
        renderProjects(mockProjects);
        // Filter buttons appear alongside the tech badge spans on the card,
        // so there may be multiple elements with the same text — use getAllByText.
        const reactElements = screen.getAllByText('React');
        expect(reactElements.length).toBeGreaterThan(0);
        const tsElements = screen.getAllByText('TypeScript');
        expect(tsElements.length).toBeGreaterThan(0);
    });

    // The detail used to be an in-page modal that dumped the GitHub README.
    // It is a real route now, so the card is a link and carries no body content.
    it('links the whole card to the project detail route', () => {
        renderProjects(mockProjects);
        const link = screen.getByRole('link', { name: /My Project/ });
        expect(link).toHaveAttribute('href', '/projects/my-project');
    });

    it('percent-encodes the slug in the href', () => {
        renderProjects([{ ...mockProjects[0], slug: 'a b' }]);
        expect(screen.getByRole('link', { name: /My Project/ })).toHaveAttribute('href', '/projects/a%20b');
    });

    it('renders the English translation when there is one', () => {
        renderProjects(translatedProject);
        expect(screen.getByText('Translated Project')).toBeInTheDocument();
        expect(screen.getByText('A translated description')).toBeInTheDocument();
        expect(screen.queryByText('내 프로젝트')).not.toBeInTheDocument();
    });

    it('falls back to the original when a project has no translation', () => {
        renderProjects(mockProjects);
        expect(screen.getByText('My Project')).toBeInTheDocument();
        expect(screen.getByText('A cool project')).toBeInTheDocument();
    });

    it('follows the chosen content language on the card', async () => {
        localStorage.setItem('portfolio-lang', 'ko');
        renderProjects(translatedProject);

        expect(await screen.findByText('내 프로젝트')).toBeInTheDocument();
        expect(screen.queryByText('Translated Project')).not.toBeInTheDocument();
    });

    it('keeps the surrounding chrome in English', () => {
        renderProjects(mockProjects);
        expect(screen.getByText('Recent Projects')).toBeInTheDocument();
        expect(screen.getByText('View Case Study')).toBeInTheDocument();
    });
});
