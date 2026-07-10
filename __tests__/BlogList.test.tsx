import { render, screen, fireEvent } from '@testing-library/react';
import BlogList from '@/components/BlogList';
import { Post } from '@/types/database.types';

jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        toggleLanguage: jest.fn(),
    }),
}));

const mockPosts: Post[] = [
    {
        id: 'post-1',
        title: 'First Post',
        slug: 'first-post',
        description: 'About Next.js',
        content: '## Intro\n\nHello',
        tags: ['Next.js'],
        published: true,
        date: '2026.07.01',
    },
    {
        id: 'post-2',
        title: 'Second Post',
        slug: 'second-post',
        description: 'About Supabase',
        content: 'Some content',
        tags: ['Supabase'],
        published: true,
        date: '2026.06.01',
    },
];

describe('BlogList', () => {
    it('renders post titles and links to their slugs', () => {
        render(<BlogList posts={mockPosts} />);
        const link = screen.getByText('First Post').closest('a');
        expect(link).toHaveAttribute('href', '/blog/first-post');
    });

    it('filters posts by tag', () => {
        render(<BlogList posts={mockPosts} />);
        expect(screen.getByText('Second Post')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Next.js' }));
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.queryByText('Second Post')).not.toBeInTheDocument();
    });

    it('shows empty state when there are no posts', () => {
        render(<BlogList posts={[]} />);
        expect(screen.getByText('blog.empty')).toBeInTheDocument();
    });
});
