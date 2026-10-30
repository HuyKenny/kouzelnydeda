// Partners: colour, name and what the detail page promises for each of them. The perks are facts from the partner's own
// pages (checked 30. 10. 2026) — the offer box lists them under the price, the CTA names the outcome, not the shop.
export interface Partner {
  name: string; color: string;
  /** what the buyer gets (box under the CTA) */
  perks: string[];
  /** verb of the CTA: "Objednat voucher" / "Rezervovat" */
  verb: string;
  /** one line below the CTA */
  trust: string;
}
const P: Record<string, Partner> = {
  'slevomat-cz': {
    name: 'Slevomat.cz', color: '#E2001A', verb: 'Objednat voucher',
    perks: ['Voucher přijde hned e-mailem', 'Hodí se jako dárek – termín si vybere obdarovaný', 'Platnost voucheru je vidět u každé nabídky'],
    trust: 'Platba a voucher u Slevomatu · cena je stejná jako u partnera',
  },
  'adrop-cz': {
    name: 'Adrop.cz', color: '#FF6A00', verb: 'Objednat poukaz',
    perks: ['Platnost poukazu 12 měsíců od zakoupení', 'E-poukaz ihned do e-mailu, nebo v dárkovém balení', 'Online rezervace termínu po zadání poukazu', 'Poukaz se dá darovat – obdarovaný si vybere den'],
    trust: 'Platba u Adropu · cena je stejná jako u partnera',
  },
  'zazitky-cz': {
    name: 'Zážitky.cz', color: '#00A3A3', verb: 'Objednat poukaz',
    perks: ['Platnost poukazu 12 měsíců', 'Okamžité doručení poukazu e-mailem', 'Výměna zážitku kdykoli zdarma', 'Vrácení zážitku až do 60 dnů', 'Možnost pojištění storna zážitku'],
    trust: 'Platba u Zážitky.cz · cena je stejná jako u partnera',
  },
  'skvele-cesko': {
    name: 'SkvěléČesko.cz', color: '#1B8A5A', verb: 'Rezervovat',
    perks: ['Elektronická vstupenka s QR kódem do e-mailu během pár minut', 'Zrušení nebo přerezervování zdarma do 1 dne před začátkem', 'Garance vrácení peněz za neposkytnutou službu', 'Platba i benefity Up, Pluxee a Edenred'],
    trust: 'Rezervace a platba u SkvěléČesko.cz · cena je stejná jako u partnera',
  },
  'firma-na-zazitky': {
    name: 'Firmanazazitky.cz', color: '#7A3FC0', verb: 'Objednat poukaz',
    perks: ['Výměna zážitku zdarma', 'Rychlé doručení – e-mailem ihned, 24/7', 'Dárkově zabaleno na přání', 'Garance ceny'],
    trust: 'Platba u Firmanazazitky.cz · cena je stejná jako u partnera',
  },
  'ceske-kormidlo': {
    name: 'České kormidlo', color: '#0B6FB3', verb: 'Rezervovat zájezd',
    perks: ['Zájezd zajišťuje cestovní kancelář ČESKÉ KORMIDLO', 'Vyberete si konkrétní termín a délku pobytu', 'U zájezdů s dopravou je v nabídce nástupní místo', 'Cena platí pro vybraný termín'],
    trust: 'Rezervace u České kormidlo · cena je stejná jako u cestovní kanceláře',
  },
};
const FALLBACK: Partner = { name: 'partnera', color: '#f0443a', verb: 'Objednat', perks: ['Voucher přijde e-mailem'], trust: 'Platba u partnera · cena je stejná' };
export const partner = (slug: string | undefined): Partner => P[slug ?? ''] ?? FALLBACK;
export const partnerColor = (slug: string | undefined) => partner(slug).color;
export const partnerName = (slug: string | undefined) => partner(slug).name;
