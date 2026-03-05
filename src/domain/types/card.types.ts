export interface Profile {
    id: string; // uuid
    username: string | null;
    display_name: string | null;
    job_title: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface Card {
    id: string; // uuid
    user_id: string | null;
    slug: string;
    title: string | null;
    primary_color: string | null; // Defaults to #3AA3FF
    secondary_color: string | null; // Defaults to #0F1C2E
    mind_file_path: string;
    github_url: string | null;
    linkedin_url: string | null;
    whatsapp: string | null;
    email: string | null;
    published: boolean | null; // Defaults to false
    created_at: string;

    // RECOMMENDED MISSING FIELDS (Identified in Audit)
    logo_url?: string | null; // Missing for the AR UI (right panel logo)
}

export interface ARViewerData {
    card: Card;
    profile: Profile;
    mindUrl: string; // Signed URL with TTL
}

// Result Object Pattern
export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };
