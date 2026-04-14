import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO, isSameDay } from "date-fns";
import { allocApi } from "@/api/alloc.api";
import { useAuthStore } from "@/store/auth.store";
import type { CalendarEntry } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyCalendarPage() {
  const user = useAuthStore((s) => s.user);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    setLoading(true);
    try {
      const res = await allocApi.calendar(user._id, from, to);
      setEntries(res.data.data);
    } catch { toast.error("Failed to load schedule"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentMonth, user?._id]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const getEntryForDay = (day: Date) =>
    entries.filter((e) => isSameDay(parseISO(e.date), day));

  const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">Your assigned shifts for the month</p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <h2 className="text-lg font-semibold w-40 text-center">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-3">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 border-r border-b last:border-r-0 bg-muted/20" />
          ))}

          {days.map((day) => {
            const dayEntries = getEntryForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "h-24 border-r border-b last:border-r-0 p-1.5 flex flex-col",
                  !isCurrentMonth && "bg-muted/20",
                  isTodayDay && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  isTodayDay && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>

                <div className="space-y-0.5 overflow-hidden">
                  {dayEntries.map((entry, i) => (
                    <Popover key={i}>
                      <PopoverTrigger asChild>
                        <button className="w-full text-left">
                          <div className="text-xs bg-primary/20 text-primary rounded px-1 py-0.5 truncate hover:bg-primary/30 transition-colors">
                            {entry.shift}
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52" side="right">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">{format(parseISO(entry.date), "EEEE, MMM d")}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shift</span>
                              <span className="font-medium">{entry.shift}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <Badge variant="success" className="text-xs">{entry.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Source</span>
                              <span className="text-xs">{entry.source}</span>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground text-center">Loading schedule…</p>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 w-6 rounded bg-primary/20" /> Shift assigned
        </span>
        <span className="flex items-center gap-1">
          <span className="h-5 w-5 rounded-full bg-primary" /> Today
        </span>
      </div>
    </div>
  );
}
