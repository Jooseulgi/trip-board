export const CATEGORIES = [
  { key: "dessert", label: "디저트", emoji: "🍰" },
  { key: "cafe", label: "카페", emoji: "☕" },
  { key: "food", label: "식당", emoji: "🍜" },
  { key: "spot", label: "명소", emoji: "📸" },
  { key: "shop", label: "쇼핑", emoji: "🛍️" },
  { key: "stay", label: "숙소", emoji: "🛏️" },
  { key: "etc", label: "기타", emoji: "📌" },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryKey = Category["key"];

export const DEFAULT_CATEGORY: CategoryKey = "dessert";

export function isCategoryKey(value: unknown): value is CategoryKey {
  return CATEGORIES.some((c) => c.key === value);
}

export function categoryOf(key: string): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** 카드에 달 수 있는 이모지 반응 */
export const REACTIONS = ["❤️", "😍", "🤤", "👏", "😂"] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];

export function isReaction(value: unknown): value is ReactionEmoji {
  return REACTIONS.includes(value as ReactionEmoji);
}
