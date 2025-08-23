import { ReactNode } from "react";

interface TableProps {
  columns: string[];
  rows: (string | ReactNode)[][];
}

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {columns.map((column, index) => (
              <th key={index} className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex} 
                  className={`border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm ${
                    cellIndex === 0 
                      ? "font-mono font-semibold text-blue-600 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}