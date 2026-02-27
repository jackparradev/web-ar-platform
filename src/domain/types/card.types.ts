export interface SocialLinks {
    github?: string;
    linkedin?: string;
    phone?: string;
    [key: string]: string | undefined;
}

export interface Profile {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    avatarUrl?: string;
}

export interface Card {
    id: string;
    slug: string;
    tenantId: string;
    profile: Profile;
    companyLogoUrl?: string;
    socialLinks: SocialLinks;
    mindFileUrl: string;
    isActive: boolean;
}
