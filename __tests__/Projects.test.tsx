import { render, screen, fireEvent } from '@testing-library/react';
import Projects from '@/components/home/Projects';
import { ContentLanguageProvider } from '@/i18n/ContentLanguage';
import { Project } from '@/types/database.types';

// The real provider rather than a mock: jsdom's navigator.language is en-US and
// localStorage is empty, so it settles on 'en' — the same path a first-time
// visitor takes. Tests that need Korean write the preference first.
function renderProjects(projects: Project[]) {
    return render(
        <ContentLanguageProvider>
            <Projects projects={projects} />
        </ContentLanguageProvider>
    );
}

jest.mock('react-markdown', () => {
    const MockMarkdown = ({ children }: { children: string }) => <div>{children}</div>;
    MockMarkdown.displayName = 'MockMarkdown';
    return MockMarkdown;
});
jest.mock('rehype-sanitize', () => ({}));

const mockProjects: Project[] = [
    {
        id: 'proj-1',
        title: 'My Project',
        title_en: null,
        description: 'A cool project',
        description_en: null,
        stack: ['React', 'TypeScript'],
        date: '2026.01',
    },
];

// Korean original with an English translation on every text column.
const translatedProject: Project[] = [
    {
        id: 'proj-2',
        title: '내 프로젝트',
        title_en: 'Translated Project',
        description: '멋진 프로젝트',
        description_en: 'A translated description',
        stack: ['React'],
        date: '2026.02',
        content: '# 한국어 본문',
        content_en: '# English body',
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

    it('opens modal on card click', () => {
        renderProjects(mockProjects);
        fireEvent.click(screen.getByText('My Project'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes modal on ESC key', () => {
        renderProjects(mockProjects);
        fireEvent.click(screen.getByText('My Project'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

    it('switches the modal body to the chosen language', async () => {
        localStorage.setItem('portfolio-lang', 'ko');
        renderProjects(translatedProject);

        fireEvent.click(await screen.findByText('내 프로젝트'));
        expect(await screen.findByText('# 한국어 본문')).toBeInTheDocument();
        expect(screen.queryByText('# English body')).not.toBeInTheDocument();
    });

    it('keeps the surrounding chrome in English', () => {
        renderProjects(mockProjects);
        expect(screen.getByText('Recent Projects')).toBeInTheDocument();
        expect(screen.getByText('View Case Study')).toBeInTheDocument();
    });
});
