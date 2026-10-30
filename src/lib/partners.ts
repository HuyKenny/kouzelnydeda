// Partner label colours (kd_partner_color of the child theme).
const COLORS: Record<string, string> = { 'slevomat-cz': '#E2001A', 'zazitky-cz': '#00A3A3', 'adrop-cz': '#FF6A00' };
export const partnerColor = (slug: string | undefined) => COLORS[slug ?? ''] ?? '#4b1fb0';
