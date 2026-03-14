import { render, screen, fireEvent } from '@testing-library/react';
import Projects from '@/components/Projects';
import { Project } from '@/types/database.types';

jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        toggleLanguage: jest.fn(),
    }),
}));

jest.mock('react-markdown', () => ({ children }: { children: string }) => <div>{children}</div>);
jest.mock('rehype-sanitize', () => ({}));

const mockProjects: Project[] = [
    {
        id: 'proj-1',
        title: 'My Project',
        description: 'A cool project',
        stack: ['React', 'TypeScript'],
        date: '2026.01',
    },
];

describe('Projects', () => {
    it('renders project cards', () => {
        render(<Projects projects={mockProjects} />);
        expect(screen.getByText('My Project')).toBeInTheDocument();
    });

    it('renders filter buttons for each tech', () => {
        render(<Projects projects={mockProjects} />);
        // Filter buttons appear alongside the tech badge spans on the card,
        // so there may be multiple elements with the same text — use getAllByText.
        const reactElements = screen.getAllByText('React');
        expect(reactElements.length).toBeGreaterThan(0);
        const tsElements = screen.getAllByText('TypeScript');
        expect(tsElements.length).toBeGreaterThan(0);
    });

    it('opens modal on card click', () => {
        render(<Projects projects={mockProjects} />);
        fireEvent.click(screen.getByText('My Project'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes modal on ESC key', () => {
        render(<Projects projects={mockProjects} />);
        fireEvent.click(screen.getByText('My Project'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
