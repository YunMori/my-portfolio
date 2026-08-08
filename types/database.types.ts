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

export type Post = {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    category_id: string | null;
    published: boolean;
    date: string;
    created_at?: string;
    // Populated by the `category:categories(...)` join in getPosts/getAllPostsAdmin.
    // Not a real column — must be excluded from Insert/Update payloads.
    category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
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
                Insert: Omit<Post, 'id' | 'created_at' | 'category'>;
                Update: Partial<Omit<Post, 'id' | 'created_at' | 'category'>>;
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
