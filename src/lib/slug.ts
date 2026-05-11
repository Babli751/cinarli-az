export function slugify(text: string): string {
  const map: Record<string, string> = {
    ə: "e", Ə: "e", ı: "i", İ: "i", ö: "o", Ö: "o", ü: "u", Ü: "u",
    ç: "c", Ç: "c", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  };
  return text
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
