// Keyword classifier for feeds that carry no usable category tree (Zážitky.cz lists gift-landing tags, Adrop a flat
// type, SkvěléČesko a product type). Returns slugs of the category tree ("@slug", see engine.resolveCats): the most
// specific match first, at most two, the section as the fallback.
const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

const STAY: Array<[RegExp, string]> = [
  [/glamping|jurt[aouy]|kupol|maringotk|tiny ?house|treehouse|posed|bublin|stan(ovy|u)\b/, 'glamping'],
  [/hausbot|vodni domek|domek na vode|netradicn/, 'netradicni-ubytovani'],
  [/lazn|termal|spa pobyt|rehabilit/, 'lazenske-pobyty'],
  [/wellness|sauna|virivk|privatni zon|masaz/, 'wellness-pobyty'],
  [/romantick|pro dva|pro pary|pro paru|svatebni noc/, 'pobyty-pro-dva'],
  [/gurman|vinar|degustac|vinn[ye]|pivn[ye]/, 'gurmanske-pobyty'],
  [/hory|horach|lyz|snezk|sumav|krkonos|jeseni[kc]|beskyd/, 'pobyty-na-horach'],
  [/rodin|s detmi|pro deti/, 'rodinne-pobyty'],
  [/se psem|pes\b|mazlicek/, 'dovolena-se-psem'],
  [/silvestr/, 'silvestrovske-pobyty'], [/vanoc|advent/, 'vanocni-pobyty'], [/velikonoc/, 'velikonocni-pobyty'], [/valentyn/, 'valentynske-pobyty'],
  [/vikend/, 'vikendove-pobyty'],
  [/cyklo|kolo|golf|aktivn|rybar|jezdeck/, 'aktivni-dovolena'],
  [/chat[ayu]|chalup/, 'chaty-a-chalupy'], [/penzion/, 'penziony'], [/zamek|zamku|luxus|chateau/, 'luxusni-hotely'],
];

const EXP: Array<[RegExp, string]> = [
  [/\bkino\b|kina\b|divadl|predstaven|koncert|cirkus|mjuzikl|opera\b|vstupenk\w* na/, 'kultura-a-vylety'],
  [/\bbalon/, 'lety-balonem'],
  [/vyhlidkov\w* let|vrtulnik|paraglid|tandem|seskok|vetron|letoun|letadl|\blet\b|\blety\b|dron|vzdusn/, 'vyhlidkove-lety'],
  [/simulator|virtualni realit|\bvr\b/, 'virtualni-realita'],
  [/unikov\w* hr|escape/, 'unikove-hry'],
  [/paintball|laser ?game|laser tag|lasergame/, 'paintball-a-laser-game'],
  [/airsoft|strelb|strelni|zbran|kulomet|kurz strel/, 'strelba'],
  [/motokar|\bkart/, 'motokary'],
  [/okruh|formul|supercar|ferrari|lamborghini|porsche|spolujizd|driftov|offroad|ctyrkol|buggy|\btank|monster|jizd\w* v |zazitkov\w* jizd|rizeni (auta|vozu|kamion|bagr|tank)/, 'zazitkove-jizdy'],
  [/bungee|zip ?line|lanov|lezeck|horolez|via ferrat|skok z|stezka v korunach/, 'lanova-centra'],
  [/raft|kanoe|kanu\b|paddle|\blod[ei]|plavb|jacht|kajak|vodni|potap|diving|surf|vodak|jetski|vodni skútr/, 'vodni-zazitky'],
  [/teambuilding|skupinov|firemni/, 'teambuilding'],
  [/bowling|biliard|dartu|zabavni centrum|detsk\w* zabavni|trampolin/, 'bowling-a-zabava'],
  [/masaz/, 'masaze'],
  [/solna jeskyn|solna/, 'solna-jeskyne'],
  [/sauna|wellness|virivk|infrasauna|lazne|termal|bazen|floating|flotac/, 'sauna'],
  [/kosmet|osetreni pleti|lifting|liceni|oboci|\brasy\b|epilac|depilac|botox|laser\w* (odstran|vlas)/, 'kosmetika'],
  [/manikur|pedikur|nehty|gelov/, 'manikura-a-pedikura'],
  [/kadernic|barber|strih|holeni/, 'kadernictvi-a-barber'],
  [/hubnut|tvarovan|kryolip|cellulit|pressoterap/, 'hubnuti-a-tvarovani'],
  [/kurz\w* (vareni|peceni)|vareni|peceni|cukrar|barista/, 'kurzy-vareni'],
  [/kurz\w* (malovan|kresl)|malovan|kresleni|malirsk/, 'kurzy-malovani'],
  [/kurz\w* foceni|fotografovan|workshop foto/, 'kurzy-foceni'],
  [/keramik|hrncir|tvoreni|vyrob|rezbar|sklo|kovar|svicek|mydl|workshop/, 'diy-kurzy'],
  [/tanecn|tanec|salsa|zumba/, 'sportovni-kurzy'],
  [/jazykov|anglick|nemeck|kurz\w* jazyk/, 'jazykove-kurzy'],
  [/degustac|vinarstv|pivovar|whisk|\bgin\b|\brum\b|ochutnavk|sommelier|barmansk/, 'degustace-vina-a-piva'],
  [/\bkone\b|konsk|jezdec|hippo|jizd\w* na koni/, 'jizda-na-koni'],
  [/zoo\b|safari|zviratk|krmeni|alpak|lam[ay]|sokoln/, 'zoo-a-zviratka'],
  [/aquapark|zabavni park|dino ?park|lanovk/, 'zabavni-parky'],
  [/muzeum|vystav|galerie|hrad\b|zamek|prohlidk|pamatk|jeskyn/, 'muzea-a-pamatky'],
  [/venkovni hr|city ?quest|pohadkov|lov pokladu|geocach|stezka/, 'venkovni-hry'],
  [/pujcovn|pronajem|vypujc|elektrokol|koloběž|kolobez/, 'pujcovny'],
  [/snowkit|lyzar|snowboard|bruslen|zimni sport|lyzovan/, 'zimni-sporty'],
  [/cviceni|posilovn|fitness|yoga|joga|pilates|crossfit|trenink|\bbox\b/, 'cviceni-a-fitness'],
  [/foceni|fotoateli|fotograf/, 'foceni'],
  [/dets|pro deti|deti\b/, 'zazitky-pro-deti'],
  [/adrenalin|extremn/, 'adrenalinove-zazitky'],
  [/striptyz|erotick/, 'striptyz'],
];

/** Series with their own hub category, added to whatever the source's own tree says (any source: Slevomat's categories are mapped separately). */
const SERIES: Array<[RegExp, string]> = [
  [/cirkus|cirkusu/, 'cirkus'],
  [/head ?spa/, 'head-spa'],
];
export const seriesCats = (name: string): string[] => {
  const n = norm(name);
  return SERIES.filter(([re]) => re.test(n)).map(([, s]) => '@' + s);
};

/** True when the offer is an overnight stay (variants "2 noci", "pobyt", accommodation words). */
export const isStay = (t: string) => /(pobyt|ubytovani|hotel\b|hotelu|penzion|apartm|glamping|tiny ?house|treehouse|jurt[aouy]|maringotk|kupol[ea]? s|\d+ noc|noci\b|nocleh)/.test(norm(t));

/** The name decides (first 140 characters of the text); the description only when the name matches nothing — otherwise
 *  a "Wellness pobyt" mentioning a massage would land among massages. */
export function classify(text: string, stay?: boolean, name?: string): string[] {
  const head = norm((name ?? text).slice(0, 140));
  const full = norm(text);
  const st = stay ?? isStay(head);
  const rules = st ? STAY : EXP;
  const pick = (t: string) => {
    const out: string[] = [];
    for (const [re, slug] of rules) if (re.test(t) && !out.includes(slug)) { out.push(slug); if (out.length >= 2) break; }
    return out;
  };
  const out = pick(head).length ? pick(head) : pick(full);
  return out.length ? out.map((s) => '@' + s) : [st ? '@pobyty' : '@zazitky'];
}
