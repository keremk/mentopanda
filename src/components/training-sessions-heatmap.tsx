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

type TrainingSessionsHeatmapProps = {
  data: Record<string, number>;
};

export function TrainingSessionsHeatmap({
  data,
}: TrainingSessionsHeatmapProps) {
  const totalSessions = Object.values(data).reduce((sum, val) => sum + val, 0);

  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);
  const startDate = startOfWeek(sixMonthsAgo, { weekStartsOn: 1 }); // Start from Monday
  const endDate = endOfWeek(today, { weekStartsOn: 1 }); // End on Sunday
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < dateRange.length; i += 7) {
    weeks.push(dateRange.slice(i, i + 7));
  }

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-blue-200";
    if (count === 2) return "bg-blue-300";
    if (count === 3) return "bg-blue-400";
    return "bg-blue-500";
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle>
          {totalSessions} training sessions in the last 6 months
        </CardTitle>
        <div className="drag-handle cursor-move">
          <GripVertical size={20} className="text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-x-auto overflow-y-hidden">
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
                if (
                  index === 0 ||
                  (isMonday(firstDayOfWeek) &&
                    !isSameMonth(firstDayOfWeek, weeks[index - 1][0]))
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
        </div>
      </CardContent>
    </Card>
  );
}
