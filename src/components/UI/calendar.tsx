import { useState } from "react";
import {
  addDays,
  addMonths,
/*   endOfMonth,
 */  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "./new-button";

interface DOBCalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
}

export function DOBCalendar({ value, onChange }: DOBCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());
  const selectedDate = value || new Date();

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/*   const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

 */  const handleDateClick = (date: Date) => {
    const isFuture = date > new Date();

    if (isFuture) {
      return;
    }

    onChange?.(date);
  };

  const generateCalendarDays = (): Date[] => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;

    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const formatDateToInput = (date: Date): string => {
    return format(date, "dd-MM-yyyy");
  };

  function isEqual(str1: string | Date, str2: string | Date): boolean {
    return String(str1).trim() === String(str2).trim();
  }

  return (
    <div className="p-3 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-2 gap-2">
        <select
          value={currentMonth.getMonth()}
          onChange={(e) =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1)
            )
          }
          className="text-sm border rounded px-2 py-1 bg-white"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {format(new Date(2000, i, 1), "MMMM")}
            </option>
          ))}
        </select>

        <select
          value={currentMonth.getFullYear()}
          onChange={(e) =>
            setCurrentMonth(
              new Date(parseInt(e.target.value), currentMonth.getMonth(), 1)
            )
          }
          className="text-sm border rounded px-2 py-1 bg-white"
        >
          {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => {
            const year = 1900 + i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          }).reverse()}
        </select>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-rows-6 gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const isSelected = isEqual(
                formatDateToInput(day),
                formatDateToInput(selectedDate)
              );
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayNumber = format(day, "d");

              return (
                <button
                  key={dayIndex}
                  type="button"
                  className={`
                    w-full p-2 px-3 rounded-md text-xs font-normal justify-center
                    ${
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "hover:bg-gray-100"
                    }
                    ${!isCurrentMonth ? "text-gray-400" : ""}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
}

export function Calendar({ value, onChange }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());
  const selectedDate = value || new Date();

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onChange?.(date);
  };

  const generateCalendarDays = (): Date[] => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;

    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const formatDateToInput = (date: Date): string => {
    return format(date, "dd-MM-yyyy");
  };

  function isEqual(str1: string | Date, str2: string | Date): boolean {
    return String(str1).trim() === String(str2).trim();
  }

  return (
    <div className="p-3 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="text-gray-500 hover:bg-gray-100"
        >
          <FiChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-medium text-center">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="text-gray-500 hover:bg-gray-100"
        >
          <FiChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-rows-6 gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const isSelected = isEqual(
                formatDateToInput(day),
                formatDateToInput(selectedDate)
              );
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayNumber = format(day, "d");

              return (
                <button
                  key={dayIndex}
                  type="button"
                  className={`
                    w-full p-2 rounded-md text-xs font-normal justify-center
                    ${
                      isSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "hover:bg-gray-100"
                    }
                    ${!isCurrentMonth ? "text-gray-400" : ""}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}