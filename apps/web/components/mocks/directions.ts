/** The four directions under review. Shared by the switcher and the index. */
export const DIRECTIONS = [
  {
    slug: "molten",
    letter: "A",
    name: "Molten",
    pitch: "Liquid chrome in amber. Poster-scale type set on a moving metal panel.",
    uses: ["Liquid Chrome", "Dot Grid (login)", "Skiper 67 video", "Skiper 31 scroll text"],
  },
  {
    slug: "blocks",
    letter: "B",
    name: "Blocks",
    pitch: "The wordmark is the hero: DEVEX built from tilting 3D cubes over a wave field.",
    uses: ["Cubes wordmark", "Waves", "Dot Field (login)", "Skiper 67 video"],
  },
  {
    slug: "phosphor",
    letter: "C",
    name: "Phosphor",
    pitch: "An amber CRT. The page boots like a machine; login is a terminal session.",
    uses: ["Faulty Terminal", "Terminal login", "Skiper 31 scroll text", "Skiper 67 video"],
  },
  {
    slug: "tidal",
    letter: "D",
    name: "Tidal",
    pitch: "Editorial and calm. Big left-set type on amber waves, bento features, split login.",
    uses: ["Waves", "Bento grid", "Skiper 31 icons", "Skiper 67 video"],
  },
] as const;

export type DirectionSlug = (typeof DIRECTIONS)[number]["slug"];
