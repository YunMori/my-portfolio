export type Profile = {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar_url: string | null;
    resume_url: string | null;
    social_links: {
        github?: string;
        linkedin?: string;
        email?: string;
    } | null;
    created_at?: string;
}

export type Project = {
    id: string;
    title: string;
    description: string;
    stack: string[];
    date: string;
    image_url?: string;
    link?: string;
    github_link?: string;
    content?: string;
    created_at?: string;
}

export type Category = {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    created_at?: string;
}

// The slice of a category carried on a post. `sort_order` comes along so chips
// render in the same order as the blog filter row.
export type PostCategory = Pick<Category, 'id' | 'name' | 'slug' | 'sort_order'>

export type Post = {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    published: boolean;
    // `date` column, so the API always returns 'YYYY-MM-DD'. Nullable: the admin
    // form allows leaving it blank. Render it through formatPostDate().
    date: string | null;
    created_at?: string;
    // Built from the post_categories join by normalizePost() in app/actions.ts, so
    // it is always present (possibly empty). Not a real column — excluded from
    // Insert/Update payloads.
    categories: PostCategory[];
}

// A post as the blog list renders it: everything except the markdown body,
// which is replaced by the reading-time estimate derived from it server-side.
// Returned by getPosts().
export type PostListItem = Omit<Post, 'content'> & { readingMinutes: number };

// Just enough of a post to list or link to it, without dragging the markdown
// body along. Returned by getPostSummaries().
export type PostSummary = Pick<Post, 'slug' | 'title' | 'date' | 'created_at'>;

// Many-to-many link between posts and categories. See supabase/migrations/20260809_02_multi_category.sql.
export type PostCategoryLink = {
    post_id: string;
    category_id: string;
}

export type Database = {
    public: {
        Tables: {
            profile: {
                Row: Profile;
                Insert: Omit<Profile, 'id' | 'created_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
            };
            projects: {
                Row: Project;
                Insert: Omit<Project, 'id' | 'created_at'>;
                Update: Partial<Omit<Project, 'id' | 'created_at'>>;
            };
            categories: {
                Row: Category;
                Insert: Omit<Category, 'id' | 'created_at'>;
                Update: Partial<Omit<Category, 'id' | 'created_at'>>;
            };
            posts: {
                Row: Post;
                Insert: Omit<Post, 'id' | 'created_at' | 'categories'>;
                Update: Partial<Omit<Post, 'id' | 'created_at' | 'categories'>>;
            };
            post_categories: {
                Row: PostCategoryLink;
                Insert: PostCategoryLink;
                Update: Partial<PostCategoryLink>;
            };
            daily_stats: {
                Row: {
                    date: string;
                    views: number;
                    created_at: string;
                };
                Insert: {
                    date?: string;
                    views?: number;
                    created_at?: string;
                };
                Update: {
                    date?: string;
                    views?: number;
                    created_at?: string;
                };
            };
        };
    };
};
