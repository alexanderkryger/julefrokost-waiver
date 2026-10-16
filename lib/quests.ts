// Opgavelisten. Rækkefølgen er rækkefølgen, man skal klare dem i.
export const quests = [
  { id: "beer", label: "Bund en øl", goal: "Find en øl og bund den" },
  {
    id: "locked",
    label: "Slip ud af rummet",
    goal: "Find den mystiske dør (?????)",
  },
  { id: "airbnb", label: "Check ind i Airbnb", goal: "Check ind i AIRBNB" },
  {
    id: "dinner",
    label: "Middag & cocktails",
    goal: "Gå til middag og cocktails på BISTRO",
  },
  { id: "disco", label: "Fest på diskoteket", goal: "Gå på DISKOTEKET" },
] as const;

export type QuestId = (typeof quests)[number]["id"];
