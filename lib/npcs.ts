import { getCharacter, type Character } from "./characters";

const npc = (id: string, name: string, look: Character["look"]): Character => ({
  id,
  name,
  title: "",
  ability: "",
  item: "",
  hearts: 0,
  magic: 0,
  look,
});

export const bouncer = npc("bouncer", "Dørmanden", {
  head: "buzz",
  hair: "#302820",
  hairShade: "#181410",
  tunic: "#18181c",
  tunicShade: "#08080a",
  pants: "#28282c",
  accessories: ["sunglasses"],
});

export const santa = npc("santa", "Julemanden", {
  head: "beanie",
  hair: "#f0f0f0",
  hairShade: "#c8c8c8",
  tunic: "#d02828",
  tunicShade: "#901818",
  pants: "#d02828",
  hat: "#d02828",
  hatShade: "#f8f8f8",
  accessories: ["beard"],
});

// Diskotekets vilde gæst og hans dansepartner.
export const casperHedegaard = npc(
  "casper-hedegaard",
  "Casper Hedegaard",
  getCharacter("casper")!.look,
);

export const danceGirl = npc("dance-girl", "Pigen", {
  head: "short",
  hair: "#1a1010",
  hairShade: "#080404",
  tunic: "#d82850",
  tunicShade: "#981838",
  skin: "#6b4226",
  skinShade: "#4a2c18",
  accessories: ["longhair", "dress"],
});
