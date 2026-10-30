// Texts and rules of the WordPress child theme (rehub-child functions.php + mu-plugin kd-redirects.php, 30. 10. 2026),
// ported verbatim: category FAQ and intros by section, city × category intros, the 404 → category heuristic.
import { cislo } from './format';

export type Kind = 'pobyt' | 'zazitek' | 'restaurace' | 'krasa' | 'kurz' | 'obecne';
// sections of the redesign v2 tree (src/data/taxonomie.json)
const ROOT_KIND: Record<string, Kind> = { pobyty: 'pobyt', zazitky: 'zazitek', 'jidlo-a-piti': 'restaurace', 'wellness-a-krasa': 'krasa', kurzy: 'kurz' };
/** kd_category_kind(): by the slug of the root category. */
export const kindOf = (rootSlug: string): Kind => ROOT_KIND[rootSlug] ?? 'obecne';

const SAFE = 'Kouzelný děda je rozcestník nabídek. Po kliknutí přejdete přímo k ověřenému partnerovi, kde objednávku dokončíte v jeho zabezpečeném prostředí. Cena pro vás zůstává stejná.';

export function categoryFaq(name: string, kind: Kind): Array<{ q: string; a: string }> {
  const n = name.toLowerCase();
  switch (kind) {
    case 'pobyt': return [
      { q: `Jak vybrat ten správný pobyt v kategorii ${n}?`, a: 'Seřaďte nabídky podle ceny, obliby nebo nejnovějších a využijte filtr ceny. U každého pobytu vidíte lokalitu, co je v ceně, původní i zvýhodněnou cenu a úsporu v korunách. Termíny a kapacity se rychle mění, proto se vyplatí rezervovat s předstihem.' },
      { q: 'Co bývá zahrnuto v ceně pobytu?', a: 'Podle konkrétní nabídky nejčastěji ubytování se snídaní či polopenzí, vstup do wellness, parkování nebo dítě zdarma. Přesný rozsah vždy najdete v detailu nabídky u partnera.' },
      { q: 'Jak rezervace probíhá a je bezpečná?', a: SAFE },
      { q: 'Dá se pobyt darovat nebo má otevřený termín?', a: 'Řadu pobytů lze pořídit jako dárkový voucher s delší platností, u kterého si termín vyberete později. Hodí se tak skvěle jako dárek. Podmínky platnosti uvádí každá nabídka.' },
    ];
    case 'zazitek': return [
      { q: `Jak vybrat ten pravý zážitek v kategorii ${n}?`, a: 'Filtrujte podle ceny a lokality a porovnejte varianty. U každého zážitku vidíte, co obnáší, původní i zvýhodněnou cenu a úsporu v korunách. Myslete i na to, pro koho zážitek je – jinou náladu má adrenalin a jinou wellness.' },
      { q: 'Kolik zážitky stojí a jak se počítá cena?', a: 'Ceny se liší podle typu zážitku. Sbíráme zvýhodněné nabídky a dárkové vouchery od prověřených partnerů, takže u většiny zážitků vidíte původní cenu i spočítanou úsporu.' },
      { q: 'Jak nákup probíhá a je bezpečný?', a: SAFE },
      { q: 'Dá se zážitek darovat?', a: 'Většina zážitků se pořizuje formou dárkového voucheru, často s otevřenou platností. Obdarovaný si pak sám zvolí termín – ideální dárek na poslední chvíli i s předstihem.' },
    ];
    case 'restaurace': return [
      { q: `Jak vybrat podnik v kategorii ${n}?`, a: 'Porovnejte lokalitu, typ kuchyně a co je v nabídce zahrnuto. U každé nabídky vidíte původní i zvýhodněnou cenu a úsporu v korunách, takže snadno vyberete podle chuti i rozpočtu.' },
      { q: 'Jak fungují vouchery do restaurací?', a: 'Většinou jde o zvýhodněné menu nebo degustace za pevnou cenu. Rozsah (počet chodů, nápoje, počet osob) i platnost najdete v detailu konkrétní nabídky u partnera.' },
      { q: 'Jak nákup probíhá a je bezpečný?', a: SAFE },
      { q: 'Musím rezervovat termín dopředu?', a: 'U gastro nabídek se rezervace termínu doporučuje – konkrétní postup a platnost voucheru uvádí každá nabídka. Často poslouží i jako dárek.' },
    ];
    case 'krasa': return [
      { q: `Jak vybrat proceduru v kategorii ${n}?`, a: 'Filtrujte podle ceny a lokality a porovnejte salony i rozsah procedury. U každé nabídky vidíte původní i zvýhodněnou cenu a úsporu v korunách, takže snadno vyberete tu pravou.' },
      { q: 'Co bývá v ceně a jak dlouho procedura trvá?', a: 'Délka i rozsah se liší podle nabídky – od krátkého ošetření po několikahodinové balíčky. Přesný obsah a délku najdete v detailu nabídky u partnera.' },
      { q: 'Jak nákup probíhá a je bezpečný?', a: SAFE },
      { q: 'Dá se procedura darovat?', a: 'Ano, většinu procedur lze pořídit jako dárkový voucher s delší platností. Skvěle se hodí jako dárek – obdarovaný si termín vybere sám.' },
    ];
    case 'kurz': return [
      { q: `Jak vybrat kurz v kategorii ${n}?`, a: 'Porovnejte délku kurzu, počet účastníků, místo konání a co je v ceně (materiál, ochutnávka, certifikát). U každé nabídky vidíte původní i zvýhodněnou cenu a úsporu v korunách.' },
      { q: 'Je kurz vhodný pro začátečníky?', a: 'Většina kurzů je určená začátečníkům i mírně pokročilým — lektor vás vším provede. Úroveň a požadavky najdete v detailu nabídky u partnera.' },
      { q: 'Jak nákup probíhá a je bezpečný?', a: SAFE },
      { q: 'Dá se kurz darovat?', a: 'Ano, kurzy jsou oblíbený zážitkový dárek. Pořídíte je jako voucher s delší platností a obdarovaný si termín vybere sám.' },
    ];
    default: return [
      { q: `Jak vybrat tu správnou nabídku v kategorii ${n}?`, a: 'Seřaďte nabídky podle ceny, obliby nebo nejnovějších a využijte filtr ceny. U každé nabídky vidíte původní i zvýhodněnou cenu, úsporu v korunách. Nabídky denně doplňujeme.' },
      { q: 'Kolik nabídky stojí a jak se počítá cena?', a: 'Ceny se liší podle typu nabídky a termínu. Sbíráme zvýhodněné nabídky a dárkové vouchery od prověřených partnerů, takže u většiny vidíte původní cenu i spočítanou úsporu.' },
      { q: 'Jak nákup probíhá a je bezpečný?', a: SAFE },
      { q: 'Dají se nabídky darovat?', a: 'Většinu nabídek lze pořídit formou dárkového voucheru, často s delší platností. Jsou tak ideální jako dárek.' },
    ];
  }
}

export function categoryIntro(name: string, kind: Kind): string {
  switch (kind) {
    case 'pobyt': return `Vybíráte v kategorii ${name}? Porovnejte lokalitu, co je v ceně i hodnocení a sledujte úsporu v korunách. Nejvýhodnější pobyty mizí rychle, vyplatí se proto rezervovat včas. Po kliknutí přejdete k ověřenému partnerovi, cena se nemění.`;
    case 'zazitek': return `Hledáte v kategorii ${name} ten pravý zážitek? Vyberte podle ceny, lokality i toho, pro koho zážitek je. U každé nabídky vidíte původní cenu i úsporu a většinu zážitků pořídíte jako dárkový voucher s otevřenou platností. Po kliknutí přejdete k ověřenému partnerovi, cena zůstává stejná.`;
    case 'restaurace': return `Vybíráte v kategorii ${name}? Porovnejte typ kuchyně, lokalitu a co je ve voucheru zahrnuto. U každé nabídky vidíte zvýhodněnou cenu i úsporu. Po kliknutí přejdete k ověřenému partnerovi, kde objednávku dokončíte – cena se nemění.`;
    case 'kurz': return `Chcete se naučit něco nového nebo darovat kurz? V kategorii ${name} porovnáte lektory, délku i to, co je v ceně, a hned vidíte úsporu. Většinu kurzů pořídíte jako dárkový voucher s otevřeným termínem. Po kliknutí přejdete k ověřenému partnerovi, cena se nemění.`;
    case 'krasa': return `Hledáte v kategorii ${name} tu pravou péči? Porovnejte salony, rozsah procedury i hodnocení a sledujte úsporu v korunách. Skvělý tip i na dárek. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
    default: return `Vybíráte v kategorii ${name}? Porovnejte ceny i hodnocení a sledujte úsporu v korunách. Nabídky denně doplňujeme. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
  }
}

/** kd_combo_intro_html(): the longer category × city text (unique content of the combo landing). */
export function comboIntro(cat: string, lok: string, count: number, kind: Kind): string {
  const catl = cat.toLowerCase();
  const cnt = cislo(count);
  switch (kind) {
    case 'pobyt': return `Plánujete ${catl} ${lok} a okolí? Sesbírali jsme ${cnt} ověřených nabídek na jednom místě, ať nemusíte porovnávat desítky webů. U každého pobytu vidíte lokalitu, co je v ceně (snídaně či polopenze, vstup do wellness, parkování nebo dítě zdarma), původní i zvýhodněnou cenu a úsporu v korunách. Nejvýhodnější pobyty ${lok} mizí rychle, vyplatí se rezervovat s předstihem — a řadu z nich pořídíte jako dárkový voucher s otevřeným termínem. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
    case 'zazitek': return `Hledáte ${catl} ${lok}? Máme ${cnt} ověřených nabídek přehledně na jednom místě. Vyberte podle ceny, lokality i toho, pro koho má zážitek být — jinou náladu má adrenalin a jinou romantika či wellness. U každé nabídky vidíte úsporu v korunách a většinu zážitků ${lok} pořídíte jako dárkový voucher s otevřenou platností, takže skvěle poslouží i jako dárek. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
    case 'restaurace': return `Máte chuť na ${catl} ${lok}? Sesbírali jsme ${cnt} ověřených nabídek na jednom místě. Porovnáte typ kuchyně, lokalitu i to, co je ve voucheru zahrnuto (počet chodů, nápoje, počet osob), a hned vidíte zvýhodněnou cenu a úsporu v korunách. U gastro nabídek se hodí rezervovat termín předem; mnohé fungují i jako dárek. Po kliknutí přejdete k ověřenému partnerovi, kde objednávku dokončíte — cena pro vás zůstává stejná.`;
    case 'krasa': return `Hledáte ${catl} ${lok}? Máme ${cnt} ověřených nabídek přehledně na jednom místě. Porovnejte salony, rozsah a délku procedury i hodnocení a sledujte úsporu v korunách. Většinu procedur ${lok} pořídíte i jako dárkový voucher s delší platností — ideální dárek, u kterého si termín vybere obdarovaný. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
    default: return `Hledáte ${catl} ${lok}? Sesbírali jsme ${cnt} ověřených nabídek na jednom místě. Porovnejte ceny i hodnocení a sledujte úsporu v korunách; nabídky navíc denně doplňujeme. Řadu z nich pořídíte jako dárkový voucher s delší platností. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
  }
}

export function cityIntro(lok: string): string {
  return `Hledáte zážitky, pobyty nebo dovolenou ${lok}? Sebrali jsme pro vás ověřené nabídky na jednom místě — od wellness a romantiky po gastro a adrenalin. Porovnejte ceny i hodnocení a vyberte tu pravou. Po kliknutí přejdete k ověřenému partnerovi, cena pro vás zůstává stejná.`;
}

/** kd_service_cat_candidates(): category chips on a city page (shown when the combo has ≥ 40 offers). */
export const SERVICE_CATS: Array<[string, string]> = [
  ['masaze', 'Masáže'], ['zazitky', 'Zážitky'], ['restaurace-a-bary', 'Restaurace a bary'], ['krasa-zdravi-a-relaxace', 'Krása a relaxace'],
  ['kosmeticke-sluzby', 'Kosmetika'], ['sauna-a-wellness', 'Sauna a wellness'], ['adrenalinove-zazitky', 'Adrenalin'], ['degustacni-menu', 'Degustace'],
  ['kavarny', 'Kavárny'], ['pece-o-plet-a-oblicej', 'Péče o pleť'],
];

/** kd_theme_target(): an unknown offer-like slug → the closest section (the order matters, first match wins). */
const THEME: Array<[RegExp, string]> = [
  [/tantra|masaz|spa|kosmetik|plet|pedikur|manikur|kadernic|barber|strih|vlas|liposukc|hifu|facelift|make-up|ras-|oboci|maderoterap|lymfo|hubnut|ems-|lpg|permanent|head-spa|ritual|zabal|relax/, '/krasa-zdravi-a-relaxace/'],
  [/adrenalin|jizd|spolujizd|rizeni|mustang|bentley|ford|formule|simulator|okruh|seskok|bungee|rafting|canyoning|motork|ctyrkolk|tank|strelb|paintball|laser-game|airsoft|rybolov|rybar/, '/adrenalinove-zazitky/'],
  [/pobyt|hotel|chat|chalup|penzion|apartm|glamping|tiny-house|treehouse|iglu|igloo|resort|dovolen|nocleh|ubytovan|vila|rezort|sardinie|chateau|zbiroh|mikulov/, '/vikendove-pobyty/'],
  [/sushi|vecere|obed|restaur|degustac|vino|pivo|pivn|pivovar|kavarn|brunch|menu|hodovani|all-you-can-eat|steak|burger|kebab|churrasco|-wok|ramen|bistro|zmrzlin|wafle|toast|frgal|koleno|zebra|prkno|jidlo|napoj/, '/restaurace-a-bary/'],
  [/wellness|sauna|virivk|infrasaun|romantika-pro-dva/, '/wellness-dovolena/'],
];
export function themeTarget(slug: string): string {
  for (const [re, to] of THEME) if (re.test(slug)) return to;
  return '/zazitky/';
}
