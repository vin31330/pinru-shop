export const OLD_LUNCH_CATEGORY = "便當盒、保鮮盒";
export const NEW_LUNCH_CATEGORY = "便當盒、保鮮盒、手提袋、保溫袋";

export function displayCategoryName(name: string): string {
  const normalized = name.trim();
  return normalized === OLD_LUNCH_CATEGORY ? NEW_LUNCH_CATEGORY : normalized;
}

export function categoryNameAliases(name: string): string[] {
  const normalized = name.trim();
  if (normalized === OLD_LUNCH_CATEGORY || normalized === NEW_LUNCH_CATEGORY) {
    return [OLD_LUNCH_CATEGORY, NEW_LUNCH_CATEGORY];
  }
  return normalized ? [normalized] : [];
}
