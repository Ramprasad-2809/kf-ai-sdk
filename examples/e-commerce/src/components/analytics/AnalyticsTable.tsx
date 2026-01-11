import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  format?: (value: any) => string;
  align?: "left" | "center" | "right";
}

interface AnalyticsTableProps<T> {
  title: string;
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
}: AnalyticsTableProps<T>) {
  const getAlignment = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${getAlignment(column.align)}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-blue-50/50 transition-colors duration-150"
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-4 text-sm ${getAlignment(column.align)} ${
                          colIndex === 0 ? "font-medium text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {column.format
                          ? column.format(row[column.key])
                          : String(row[column.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
