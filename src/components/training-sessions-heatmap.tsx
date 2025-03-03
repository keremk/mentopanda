import React from "react";
import {
  subMonths,
  eachDayOfInterval,
  format,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isMonday,
} from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { getTrainingHeatmapDataAction } from "@/app/actions/history-actions";

export async function TrainingSessionsHeatmap({
  forUserId,
}: {
  forUserId?: string;
}) {
  const data = await getTrainingHeatmapDataAction(forUserId);
  const totalSessions = Object.values(data).reduce((sum, val) => sum + val, 0);

  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  const startDate = startOfWeek(threeMonthsAgo, { weekStartsOn: 1 }); // Start from Monday
  const endDate = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < dateRange.length; i += 7) {
    weeks.push(dateRange.slice(i, i + 7));
  }

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-900";
    if (count === 1) return "bg-blue-200 dark:bg-blue-900";
    if (count === 2) return "bg-blue-300 dark:bg-blue-600";
    if (count === 3) return "bg-blue-400 dark:bg-blue-400";
    return "bg-blue-500 dark:bg-blue-300";
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>Training Heatmap</CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="flex justify-center">
          <div className="flex flex-col">
            <div className="flex">
              <div className="mr-2 grid grid-rows-7 gap-1 text-sm text-gray-500">
                {dayLabels.map((day, index) => (
                  <span key={index} className="h-4 flex items-center">
                    {day}
                  </span>
                ))}
              </div>
              <div>
                <div className="grid grid-rows-7 grid-flow-col gap-1">
                  {weeks.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                      {week.map((day, dayIndex) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const count = data[dateKey] || 0;
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-4 h-4 ${getColor(count)} rounded-sm`}
                            title={`${format(
                              day,
                              "MMM d, yyyy"
                            )}: ${count} sessions`}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-2 flex text-sm text-gray-500">
                  {weeks.map((week, index) => {
                    const firstDayOfWeek = week[0];

                    // Count how many weeks are in this month
                    const weeksInMonth = weeks.filter((w) =>
                      isSameMonth(w[0], firstDayOfWeek)
                    ).length;

                    // Show month name only if:
                    // 1. It's the first week of a new month AND
                    // 2. Either:
                    //    - It's the current month OR
                    //    - There are more than 2 weeks visible in this month
                    if (
                      isMonday(firstDayOfWeek) &&
                      !isSameMonth(firstDayOfWeek, weeks[index - 1]?.[0]) &&
                      (isSameMonth(firstDayOfWeek, today) || weeksInMonth > 2)
                    ) {
                      return (
                        <span key={index} className="w-4 mr-1">
                          {format(firstDayOfWeek, "MMM")}
                        </span>
                      );
                    }
                    return <span key={index} className="w-4 mr-1"></span>;
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="mr-2">Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-4 h-4 ${getColor(level)} rounded-sm mr-1`}
                />
              ))}
              <span className="ml-1">More</span>
              <span className="ml-16">{totalSessions} sessions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
