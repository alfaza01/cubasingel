import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";

interface HolidayData {
  [dateString: string]: {
    description: string[];
    holiday: boolean;
    summary: string[];
  };
}

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<HolidayData>({});
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    // Fetch Indonesian holidays (returns data mostly for the current year, like 2026)
    const fetchHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/calendar.json",
        );
        if (res.ok) {
          const data = await res.json();
          setHolidays(data);
        }
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchHolidays();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Senin sebagai awal minggu
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getHijriDate = (date: Date) => {
    try {
      const formatted = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        calendar: "islamic-umalqura",
      }).format(date);
      // Format usually: "12/24/1447 AH"
      const parts = formatted.split(" ")[0].split("/");
      if (parts.length === 3) {
        const mIdx = parseInt(parts[0], 10) - 1;
        const d = parts[1];
        const y = parts[2];
        const months = [
          "Muharram",
          "Safar",
          "Rabiul Awal",
          "Rabiul Akhir",
          "Jumadil Awal",
          "Jumadil Akhir",
          "Rajab",
          "Sya'ban",
          "Ramadhan",
          "Syawal",
          "Dzulqa'dah",
          "Dzulhijjah",
        ];
        return `${d} ${months[mIdx]} ${y} H`;
      }
      return "";
    } catch {
      return "";
    }
  };

  const getHijriShort = (date: Date) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        calendar: "islamic-umalqura",
      }).format(date);
    } catch {
      return "";
    }
  };

  const getHolidayInfo = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    if (holidays[key]) {
      return holidays[key];
    }
    // Static Fallbacks for Sundays (always red)
    if (date.getDay() === 0) {
      return {
        holiday: true,
        summary: ["Hari Minggu"],
        description: ["Libur Akhir Pekan"],
      };
    }
    return null;
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-y-auto">
      {/* Header Panel */}
      <div className="bg-indigo-700 pt-4 pb-3 px-4 rounded-b-2xl shadow-lg sticky top-0 z-20 shrink-0">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <CalendarIcon size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wide leading-none">
                KALENDER
              </h1>
              <p className="text-[8px] text-indigo-200 uppercase font-bold tracking-wider mt-0.5">
                Masehi & Hijriah
              </p>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="mt-2.5 bg-white/10 border border-white/20 rounded-xl p-2.5 backdrop-blur-sm">
            <h2 className="text-[15px] font-black text-white capitalize leading-tight">
              {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
            </h2>
            <p className="text-indigo-100 font-medium text-[11px] mt-0.5 mb-1.5">
              {getHijriDate(selectedDate)}
            </p>

            {(() => {
              const info = getHolidayInfo(selectedDate);
              if (info && info.holiday) {
                return (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-100 border border-red-500/30 rounded text-[9px] uppercase font-black tracking-wider leading-none">
                    <Info size={10} />
                    <span>{info.summary.join(", ")}</span>
                  </div>
                );
              }
              return (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 rounded text-[9px] uppercase font-black tracking-wider leading-none">
                  <span>Hari Kerja Biasa</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="px-4 pt-3 pb-6">
        {/* Calendar Nav */}
        <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              {format(currentDate, dateFormat, { locale: id })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 relative">
            {/* Days of Week */}
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(
              (day, idx) => (
                <div
                  key={day}
                  className={`text-center text-[10px] uppercase font-black tracking-wider pb-2 ${idx === 6 ? "text-red-500" : "text-slate-400"}`}
                >
                  {day}
                </div>
              ),
            )}

            {days.map((day, dIdx) => {
              const isSelected = selectedDate
                ? isSameDay(day, selectedDate)
                : false;
              const isCurrentMonth = isSameMonth(day, monthStart);
              const holidayInfo = getHolidayInfo(day);
              const isRedDay = holidayInfo?.holiday === true;
              const hasEvents =
                holidayInfo !== null && holidayInfo.holiday === true;

              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative flex flex-col items-center justify-center min-h-[48px] rounded-xl cursor-pointer transition-all border
                    ${isSelected ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20" : "border-transparent hover:border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900"}
                    ${!isCurrentMonth ? "opacity-30 grayscale" : "opacity-100"}
                  `}
                >
                  <span
                    className={`text-[13px] font-black leading-none mb-0.5 ${isSelected ? "text-white" : isRedDay ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}
                  >
                    {format(day, "d")}
                  </span>

                  <span
                    className={`text-[8.5px] scale-90 font-bold leading-none ${isSelected ? "text-indigo-200" : "text-slate-400"}`}
                  >
                    {getHijriShort(day)}
                  </span>

                  {/* Dot indicator for holidays */}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-red-400"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            Keterangan Kalender
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
              </div>
              <span className="leading-tight">
                Tanggal Merah / Libur Nasional (Minggu & Cuti Bersama)
              </span>
            </li>
            <li className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              </div>
              <span className="leading-tight">Hari ini (Tanggal Berjalan)</span>
            </li>
            <li className="flex gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Kalender sudah dilengkapi dengan penanggalan Hijriah (nomor
                kecil di bawah tanggal Masehi). Data hari libur sinkron dengan
                ketetapan pemerintah Indonesia.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
