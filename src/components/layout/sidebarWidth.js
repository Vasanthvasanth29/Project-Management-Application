// Shared width rules for the resizable navigation sidebar (AppShell + Sidebar).
export const SIDEBAR_MIN_WIDTH = 80;
export const SIDEBAR_MAX_WIDTH = 336;
export const SIDEBAR_DEFAULT_WIDTH = 272;
// At or below this width the sidebar switches to the icon-only layout.
export const SIDEBAR_ICON_ONLY_BELOW = 112;
export const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebar_width';
export const clampSidebarWidth = (width) => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
export const readSidebarWidth = () => {
    try {
        const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
        const parsed = Number(raw);
        if (raw !== null && Number.isFinite(parsed))
            return clampSidebarWidth(parsed);
    }
    catch {
        /* storage unavailable or corrupt — fall back to the default */
    }
    return SIDEBAR_DEFAULT_WIDTH;
};
export const storeSidebarWidth = (width) => {
    try {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampSidebarWidth(width)));
    }
    catch {
        /* storage unavailable — width simply won't persist */
    }
};
