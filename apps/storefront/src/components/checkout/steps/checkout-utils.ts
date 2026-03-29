/** Carrier for pickup / shipping option matching. */
export type CarrierCode = "gls" | "dao" | "pdk";

/** Danish day names (short for ranges). Order: Mon=0 .. Sun=6. */
const DAY_NAMES_DA: Record<number, string> = {
  0: "Mandag",
  1: "Tirsdag",
  2: "Onsdag",
  3: "Torsdag",
  4: "Fredag",
  5: "Lørdag",
  6: "Søndag",
};
const DAY_SHORT_DA: Record<number, string> = {
  0: "Man",
  1: "Tir",
  2: "Ons",
  3: "Tor",
  4: "Fre",
  5: "Lør",
  6: "Søn",
};
const EN_DAY_TO_INDEX: Record<string, number> = {
  monday: 0, mon: 0, tuesday: 1, tue: 1, wednesday: 2, wed: 2,
  thursday: 3, thu: 3, thurs: 3, friday: 4, fri: 4, saturday: 5, sat: 5, sunday: 6, sun: 6,
};

/**
 * Parse opening_hours lines (e.g. "Monday: 06:00-22:00"), translate to Danish,
 * group consecutive days with identical hours, return e.g. ["Man-fre: 06.00-22.00", "Lør-søn: 07.00-22.00"].
 */
export function formatOpeningHoursGrouped(hours: string[]): string[] {
  if (!Array.isArray(hours) || hours.length === 0) return [];
  const parsed: { day: number; time: string }[] = [];
  for (const line of hours) {
    const trimmed = (line || "").trim();
    const match = trimmed.match(/^(\w+)\s*[:\-]\s*(.+)$/i);
    if (!match) continue;
    const dayKey = match[1].toLowerCase();
    const dayIndex = EN_DAY_TO_INDEX[dayKey];
    if (dayIndex === undefined) continue;
    let time = match[2].trim().replace(/\s/g, "");
    time = time.replace(/:/g, "."); // Danish style 06.00-22.00
    parsed.push({ day: dayIndex, time });
  }
  parsed.sort((a, b) => a.day - b.day);
  const groups: { start: number; end: number; time: string }[] = [];
  for (const { day, time } of parsed) {
    const last = groups[groups.length - 1];
    if (last && last.end === day - 1 && last.time === time) {
      last.end = day;
    } else {
      groups.push({ start: day, end: day, time });
    }
  }
  return groups.map((g) => {
    const startLabel = g.start === g.end ? DAY_NAMES_DA[g.start] : `${DAY_SHORT_DA[g.start]}-${DAY_SHORT_DA[g.end]}`;
    return `${startLabel}: ${g.time}`;
  });
}
