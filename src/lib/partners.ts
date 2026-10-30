// Partner colours and names (store slug → label); the CTA names the partner ("Koupit na Slevomat.cz").
const COLORS: Record<string, string> = { 'slevomat-cz': '#E2001A', 'zazitky-cz': '#00A3A3', 'adrop-cz': '#FF6A00' };
const HOSTS: Record<string, string> = { 'slevomat-cz': 'Slevomat.cz', 'zazitky-cz': 'Zážitky.cz', 'adrop-cz': 'Adrop.cz' };
export const partnerColor = (slug: string | undefined) => COLORS[slug ?? ''] ?? '#f0443a';
export const partnerName = (slug: string | undefined) => HOSTS[slug ?? ''] ?? 'partnera';
