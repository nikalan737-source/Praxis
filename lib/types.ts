// Shared app-level TypeScript types

export interface Habit {
  id: string;
  userId: string;
  theoryId?: string;
  theoryTitle?: string;
  goalCategory?: string;
  evidenceTier?: "Strong" | "Emerging" | "Theoretical" | "Unsupported";
  actionText: string;
  frequency: "daily" | "weekly" | "custom";
  scheduledDays: string[]; // e.g. ["Mon","Wed","Fri"]
  isActive: boolean;
  notionId?: string;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedDate: string; // ISO date "YYYY-MM-DD"
  note?: string;
}

export interface ScheduleSuggestion {
  frequency: "daily" | "weekly" | "custom";
  scheduledDays: string[];
  rationale: string;
}

export const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayAbbr = (typeof ALL_DAYS)[number];

/** Return today's date as "YYYY-MM-DD" in local time */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Return day abbreviation for a given ISO date */
export function dayAbbr(iso: string): DayAbbr {
  const d = new Date(iso + "T12:00:00"); // noon to avoid DST edge
  return ALL_DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

/** Return ISO dates for every day in the month containing `iso` */
export function monthDates(iso: string): string[] {
  const d = new Date(iso + "T12:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const dates: string[] = [];
  for (let i = first.getDate(); i <= last.getDate(); i++) {
    const day = new Date(year, month, i);
    dates.push(
      `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

/** Return ISO dates for Mon–Sun of the week containing `iso` */
export function weekDates(iso: string): string[] {
  const d = new Date(iso + "T12:00:00");
  const dow = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate()
    ).padStart(2, "0")}`;
  });
}
