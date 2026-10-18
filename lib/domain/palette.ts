/** Colors are stored as keys so each can have its own light and dark value (see globals.css). */
export const PALETTE = ["indigo", "teal", "raspberry", "amber", "violet", "sky", "green", "slate"] as const;
export type PaletteKey = (typeof PALETTE)[number];

export const colorVar = (key: string) => `var(--c-${PALETTE.includes(key as PaletteKey) ? key : "slate"})`;
