import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostManager from '@/components/admin/PostManager';
import { PostAdminListItem, Category } from '@/types/database.types';

// PostBody pulls in react-markdown/rehype-sanitize (ESM); mock them the same way
// Projects.test.tsx does so Jest can load the module tree.
jest.mock('react-markdown', () => {
    const MockMarkdown = ({ children }: { children: string }) => <div>{children}</div>;
    MockMarkdown.displayName = 'MockMarkdown';
    return MockMarkdown;
});
jest.mock('rehype-sanitize', () => ({}));

const addPost = jest.fn().mockResolvedValue({ success: true });
const updatePost = jest.fn().mockResolvedValue({ success: true });
const deletePost = jest.fn().mockResolvedValue({ success: true });
// The admin list no longer carries markdown bodies; Edit fetches the one post's.
const getPostForEdit = jest.fn().mockResolvedValue({
    id: 'post-1',
    content: '## Heading',
    content_en: null,
});

jest.mock('@/app/actions/posts', () => ({
    addPost: (fd: FormData) => addPost(fd),
    updatePost: (fd: FormData) => updatePost(fd),
    deletePost: (id: string) => deletePost(id),
    getPostForEdit: (id: string) => getPostForEdit(id),
}));

const refresh = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ refresh, push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('sonner', () => ({
    toast: { success: jest.fn(), error: jest.fn() },
}));

const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Frontend', slug: 'frontend', sort_order: 1 },
    { id: 'cat-2', name: 'Backend', slug: 'backend', sort_order: 2 },
];

const mockPosts: PostAdminListItem[] = [
    {
        id: 'post-1',
        title: 'Existing Post',
        title_en: null,
        slug: 'existing-post',
        description: 'desc',
        description_en: null,
        categories: [mockCategories[0], mockCategories[1]],
        published: true,
        date: '2026.07.01',
    },
];

beforeEach(() => {
    jest.clearAllMocks();
});

describe('PostManager content preview', () => {
    it('swaps the textarea for a rendered preview and back', async () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);

        // Tailwind's `hidden` isn't loaded in jsdom, so assert the class rather
        // than computed visibility.
        const textarea = screen.getByLabelText('Content (Markdown)');
        fireEvent.change(textarea, { target: { name: 'content', value: '# Hello' } });
        expect(textarea).not.toHaveClass('hidden');

        fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
        // PostBody is loaded with next/dynamic now, so the parser arrives a tick late.
        // The hidden textarea still carries the same text, so match the rendered
        // markdown node specifically.
        await waitFor(() =>
            expect(screen.getByText('# Hello', { selector: 'div' })).toBeInTheDocument()
        );
        expect(textarea).toHaveClass('hidden');

        // Hidden, not unmounted — the same node and its value survive the round trip.
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        expect(textarea).not.toHaveClass('hidden');
        expect(textarea).toHaveValue('# Hello');
    });

    it('tells the author when there is nothing to preview', () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
        expect(screen.getByText('미리볼 내용이 없습니다.')).toBeInTheDocument();
    });
});

describe('PostManager categories', () => {
    it('submits one category_id entry per checked category', async () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);

        fireEvent.change(screen.getByLabelText('Title'), { target: { name: 'title', value: 'New Post' } });
        fireEvent.click(screen.getByRole('checkbox', { name: 'Frontend' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Backend' }));
        fireEvent.click(screen.getByRole('button', { name: 'Add Post' }));

        await waitFor(() => expect(addPost).toHaveBeenCalled());
        const formData: FormData = addPost.mock.calls[0][0];
        expect(formData.getAll('category_id')).toEqual(['cat-1', 'cat-2']);
    });

    it('sends no category_id when nothing is checked', async () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);

        fireEvent.change(screen.getByLabelText('Title'), { target: { name: 'title', value: 'Uncategorized Post' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Post' }));

        await waitFor(() => expect(addPost).toHaveBeenCalled());
        const formData: FormData = addPost.mock.calls[0][0];
        expect(formData.getAll('category_id')).toEqual([]);
    });

    it('pre-checks the post\'s categories when editing', async () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

        expect(screen.getByRole('checkbox', { name: 'Frontend' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Backend' })).toBeChecked();
        // The body arrives separately — settle it so the test doesn't leak an update.
        await waitFor(() => expect(getPostForEdit).toHaveBeenCalledWith('post-1'));
    });

    it('loads the markdown body only when a post is opened for editing', async () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);
        expect(getPostForEdit).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

        await waitFor(() =>
            expect(screen.getByLabelText(/Content \(Markdown\)/)).toHaveValue('## Heading')
        );
    });

    it('lists every category of a post in the existing-post row', () => {
        render(<PostManager initialPosts={mockPosts} categories={mockCategories} />);
        expect(screen.getByText(/Frontend, Backend/)).toBeInTheDocument();
    });
});
