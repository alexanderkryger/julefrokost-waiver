// Opgavelisten. Rækkefølgen er rækkefølgen, man skal klare dem i.
export const quests = [
  { id: "beer", label: "Bund en øl", goal: "Find en øl og bund den" },
  { id: "escape", label: "Undslip escape room", goal: "Gå ind i ESCAPE ROOM" },
  { id: "airbnb", label: "Check ind i Airbnb", goal: "Check ind i AIRBNB" },
  { id: "dinner", label: "Spis aftensmad", goal: "Gå til aftensmad på RESTAURANTEN" },
  { id: "disco", label: "Diskotek: underskriv", goal: "Gå på DISKOTEKET" },
] as const;

export type QuestId = (typeof quests)[number]["id"];
