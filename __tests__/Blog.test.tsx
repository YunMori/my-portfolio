import { render, screen, fireEvent } from '@testing-library/react';
import Blog from '@/components/Blog';
import { BlogPost } from '@/types/database.types';

// Mock LanguageContext
jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        toggleLanguage: jest.fn(),
    }),
}));

// Mock react-markdown
jest.mock('react-markdown', () => ({ children }: { children: string }) => <div>{children}</div>);
jest.mock('rehype-sanitize', () => ({}));

const mockPosts: BlogPost[] = [
    {
        id: '1',
        title: 'Test Post',
        slug: 'test-post',
        description: 'A test blog post',
        content: '# Hello World',
        tags: ['react', 'typescript'],
        published_at: '2026-01-01T00:00:00Z',
    },
];

describe('Blog', () => {
    it('renders nothing when posts array is empty', () => {
        const { container } = render(<Blog posts={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders blog post cards', () => {
        render(<Blog posts={mockPosts} />);
        expect(screen.getByText('Test Post')).toBeInTheDocument();
        expect(screen.getByText('A test blog post')).toBeInTheDocument();
    });

    it('opens modal on card click', () => {
        render(<Blog posts={mockPosts} />);
        fireEvent.click(screen.getByText('Test Post'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes modal on ESC key', () => {
        render(<Blog posts={mockPosts} />);
        fireEvent.click(screen.getByText('Test Post'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
