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
        };
    };
};
