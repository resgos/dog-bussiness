// One-off: цензура брани в УЖЕ сохранённом пользовательском контенте.
// Новый контент цензурится на записи (lib/profanity в API-роутах); этот скрипт
// подчищает историю. Логика — копия src/lib/profanity.ts (держать в синхроне).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const LOOKALIKE = { a:"а",b:"б",c:"с",e:"е",k:"к",m:"м",h:"н",o:"о",p:"р",t:"т",x:"х",y:"у",u:"и",i:"и","3":"з","0":"о","4":"ч","6":"б","9":"д","@":"а",$:"с" };
const normalizeWord = (raw) => raw.toLowerCase().replace(/ё/g,"е")
  .replace(/[a-z0-9@$]/g,(c)=>LOOKALIKE[c]??c).replace(/[^а-я]/g,"").replace(/(.)\1{2,}/g,"$1$1");
const PREFIX="(?:по|за|на|от|до|пере|при|обо|об|объ|под|съ|раз|разъ|рас|вы|у|из|недо|пре|с|вз|въ|ни|не|о)?";
const ROOTS=[new RegExp(`^${PREFIX}ху[йяеиюе]`),new RegExp(`^${PREFIX}пизд`),
  new RegExp(`^${PREFIX}[ея]б(?:ат|ал|ан|ар|ен|ет|еш|ис|ло|ну|ыв|уч|ущ|а$|у$|и$|ы$)`),
  new RegExp(`^${PREFIX}бля(?:д|т|$)`),/^мудак|^мудач|^мудил/,/^пид[оа]р|^пидр/,/^г[ао]ндон/,/^залуп/,/^шлюх/,/^долбо[ея]б|^далбо[ея]б/];
const isProfane=(w)=>{const n=normalizeWord(w);return n.length>=3&&ROOTS.some((r)=>r.test(n));};
const WORD_RE=/[а-яёa-z0-9@$]+(?:[.\-_*]+[а-яёa-z0-9@$]+)*/gi;
const censor=(t)=>!t?t:t.replace(WORD_RE,(w)=>isProfane(w)?w[0]+"*".repeat(Math.max(w.length-1,2)):w);

// [модель, поле, nullable] — для required-полей фильтр not:null невалиден.
const targets = [
  ["lostReport","comment",true],["foundReport","comment",true],["sighting","comment",true],
  ["post","text",false],["comment","text",false],["reunion","story",false],["adoptionListing","story",true],
];
let fixed = 0;
for (const [model, field, nullable] of targets) {
  const rows = await db[model].findMany({
    ...(nullable ? { where: { [field]: { not: null } } } : {}),
    select: { id: true, [field]: true },
  });
  for (const row of rows) {
    const clean = censor(row[field]);
    if (clean !== row[field]) {
      await db[model].update({ where: { id: row.id }, data: { [field]: clean } });
      fixed++;
      console.log(`  ✚ ${model}.${field} ${row.id}: «${row[field].slice(0,40)}» → «${clean.slice(0,40)}»`);
    }
  }
}
console.log(`\nОчищено записей: ${fixed}`);
await db.$disconnect();
