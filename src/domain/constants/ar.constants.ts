export const AR_ANIMATION_TIMINGS = {
    STABILIZATION_DELAY: 350,
    LOST_INDICATOR_DELAY: 1200,
    PROFILE_PANEL_DURATION: 700,
    LOGO_PANEL_DURATION: 700,
    LINKS_PANEL_DURATION: 650,
    PANELS_DEPLOY_DELAY: 1100, // Total deployment time sum
    TOAST_DURATION: 2200,
    ACTION_DELAY: 350,
} as const;

export const AR_VISUAL_CONFIG = {
    CARD_ASPECT_RATIO: 1.8,
    SCAN_PERCENT_FILL: 0.85,
    SCAN_MAX_WIDTH_PX: 420,
} as const;

export const DEFAULT_SOCIAL_LINKS = {
    github: 'https://github.com',
    linkedin: 'https://www.linkedin.com',
    phone: 'https://wa.me'
} as const;
