import { ReactNode } from "react";

interface FeatureItem {
  name: string;
  description: string | ReactNode;
  type?: string;
  notes?: string | ReactNode;
}

interface FeatureTableProps {
  features: Record<string, FeatureItem>;
  showTypeColumn?: boolean;
  showNotesColumn?: boolean;
}

export function FeatureTable({ features, showTypeColumn = false, showNotesColumn = false }: FeatureTableProps) {
  const entries = Object.entries(features);

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Feature
            </th>
            <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Description
            </th>
            {showTypeColumn && (
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                Type
              </th>
            )}
            {showNotesColumn && (
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                Notes
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, feature], index) => (
            <tr key={key} className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                {feature.name}
              </td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {feature.description}
              </td>
              {showTypeColumn && (
                <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 font-mono text-sm text-purple-600 dark:text-purple-400">
                  {feature.type}
                </td>
              )}
              {showNotesColumn && (
                <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {feature.notes}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}