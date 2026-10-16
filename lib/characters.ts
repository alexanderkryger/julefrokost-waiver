// Alle helte. Ret frit i titler, egenskaber, items og udseende her.

export type HeadStyle =
  | "short"
  | "linkcap"
  | "beanie"
  | "strawhat"
  | "spiky"
  | "buzz"
  | "slick"
  | "swoop"
  | "hood";
export type Accessory =
  | "sunglasses"
  | "chain"
  | "gloves"
  | "shield"
  | "mug"
  | "beard"
  | "longhair"
  | "dress";

export type Character = {
  id: string;
  name: string;
  title: string;
  ability: string;
  item: string;
  hearts: number; // udholdenhed, 1–10
  magic: number; // charme, 1–10
  gameOver?: boolean; // vælges denne helt, er spillet slut
  look: {
    head: HeadStyle;
    hair: string;
    hairShade: string;
    tunic: string;
    tunicShade: string;
    pants?: string;
    hat?: string;
    hatShade?: string;
    skin?: string;
    skinShade?: string;
    accessories?: Accessory[];
  };
};

export const characters: Character[] = [
  {
    id: "martin",
    name: "Martin",
    title: "Mesterbryggeren",
    ability:
      "Kan åbne en øl med hvad som helst – inklusive en anden øl. Har aldrig set et tomt glas, kun et glas der venter.",
    item: "Flaskeåbneren",
    hearts: 8,
    magic: 5,
    look: {
      head: "linkcap",
      hair: "#e0a040",
      hairShade: "#a86818",
      tunic: "#48a830",
      tunicShade: "#286818",
      hat: "#48a830",
      hatShade: "#286818",
      accessories: ["mug"],
    },
  },
  {
    id: "dien",
    name: "Dien",
    title: "Natteravnen",
    ability:
      "Bliver stærkere for hver time efter midnat. Ved kl. 04 er han praktisk talt udødelig.",
    item: "Lampen",
    hearts: 6,
    magic: 9,
    look: {
      head: "beanie",
      hair: "#282020",
      hairShade: "#100808",
      tunic: "#484858",
      tunicShade: "#282838",
      hat: "#683070",
      hatShade: "#401848",
    },
  },
  {
    id: "jacob",
    name: "Jacob",
    title: "Navigatøren",
    ability:
      "Finder altid vej hjem. Ingen – heller ikke Jacob selv – ved hvordan.",
    item: "Det Magiske Kort",
    hearts: 7,
    magic: 5,
    look: {
      head: "short",
      hair: "#784020",
      hairShade: "#482010",
      tunic: "#3870d0",
      tunicShade: "#204088",
      accessories: ["shield"],
    },
  },
  {
    id: "alexander",
    name: "Alexander",
    title: "Arrangøren",
    ability:
      "Kender Destinationen. Siger det ikke. Forbeholder sig retten til at ændre programmet uden varsel, begrundelse eller undskyldning.",
    item: "Den Forseglede Kuvert",
    hearts: 7,
    magic: 10,
    look: {
      head: "slick",
      hair: "#383028",
      hairShade: "#181410",
      tunic: "#202028",
      tunicShade: "#101014",
      accessories: ["sunglasses"],
    },
  },
  {
    id: "viet",
    name: "Viet",
    title: "Dansegulvets Hersker",
    ability:
      "+50 % rytme, −100 % skam. Kan ikke stoppes, når først de rigtige 90'er-hits kører.",
    item: "Pegasusstøvlerne",
    hearts: 6,
    magic: 8,
    look: {
      head: "spiky",
      hair: "#202020",
      hairShade: "#080808",
      tunic: "#d03030",
      tunicShade: "#881818",
    },
  },
  {
    id: "uros",
    name: "Uros",
    title: "Bjørnen",
    ability:
      "Påstår at være immun over for tømmermænd. Påstanden er aldrig blevet bekræftet af uafhængige kilder.",
    item: "Kraftbehandsken",
    hearts: 10,
    magic: 3,
    look: {
      head: "buzz",
      hair: "#584030",
      hairShade: "#382818",
      tunic: "#607038",
      tunicShade: "#384420",
      accessories: ["gloves"],
    },
  },
  {
    id: "morten",
    name: "Morten",
    title: "Bankeren",
    ability:
      "Giver første omgang. Husker det ikke. Giver derfor også anden omgang.",
    item: "Rupee-pungen",
    hearts: 7,
    magic: 6,
    look: {
      head: "slick",
      hair: "#f0d070",
      hairShade: "#c09830",
      tunic: "#e8e8e8",
      tunicShade: "#a8a8b0",
      accessories: ["chain"],
    },
  },
  {
    id: "casper",
    name: "Casper",
    title: "Diplomaten",
    ability:
      "Kan tale sig ind på enhver bar – og ud af enhver regning. Har venner i alle byer, også dem han aldrig har besøgt.",
    item: "Fløjten",
    hearts: 6,
    magic: 9,
    look: {
      head: "strawhat",
      hair: "#302820",
      hairShade: "#181008",
      tunic: "#d8c8a0",
      tunicShade: "#a08860",
      hat: "#e8c070",
      hatShade: "#b03828",
    },
  },
  {
    id: "niklas",
    name: "Niklas",
    title: "Krønikeskriveren",
    ability:
      "Husker alt. Det er et problem for alle andre. Har billeder af ting, der officielt aldrig er sket.",
    item: "Det Magiske Spejl",
    hearts: 7,
    magic: 7,
    look: {
      head: "swoop",
      hair: "#905828",
      hairShade: "#583010",
      tunic: "#283868",
      tunicShade: "#141c40",
    },
  },
  {
    id: "phung",
    name: "Phung",
    title: "Den Forbudte",
    ability:
      "Legenden siger, at ingen har valgt Phung og vendt tilbage. Vælg med omhu.",
    item: "???",
    hearts: 1,
    magic: 1,
    gameOver: true,
    look: {
      head: "hood",
      hair: "#202020",
      hairShade: "#101010",
      tunic: "#383048",
      tunicShade: "#201828",
      hat: "#483858",
      hatShade: "#281c34",
    },
  },
];

export const characterIds = characters
  .filter((c) => !c.gameOver)
  .map((c) => c.id);

export function getCharacter(id: string | null | undefined) {
  return characters.find((c) => c.id === id) ?? null;
}
