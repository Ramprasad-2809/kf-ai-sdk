import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export interface BarChartData {
  label: string;
  value: number;
  secondaryValue?: number;
}

type BarColorTheme = "blue" | "green" | "purple" | "red" | "indigo" | "orange" | "cyan";

interface CSSBarChartProps {
  title: string;
  data: BarChartData[];
  isLoading?: boolean;
  formatValue?: (value: number) => string;
  formatSecondaryValue?: (value: number) => string;
  colorTheme?: BarColorTheme;
  showSecondaryValue?: boolean;
  emptyMessage?: string;
}

const colorThemes: Record<BarColorTheme, { gradient: string; bg: string; text: string }> = {
  blue: {
    gradient: "bg-gradient-to-r from-blue-500 to-blue-400",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  green: {
    gradient: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  purple: {
    gradient: "bg-gradient-to-r from-purple-500 to-purple-400",
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  red: {
    gradient: "bg-gradient-to-r from-red-500 to-red-400",
    bg: "bg-red-100",
    text: "text-red-700",
  },
  indigo: {
    gradient: "bg-gradient-to-r from-indigo-500 to-indigo-400",
    bg: "bg-indigo-100",
    text: "text-indigo-700",
  },
  orange: {
    gradient: "bg-gradient-to-r from-orange-500 to-orange-400",
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  cyan: {
    gradient: "bg-gradient-to-r from-cyan-500 to-cyan-400",
    bg: "bg-cyan-100",
    text: "text-cyan-700",
  },
};

export function CSSBarChart({
  title,
  data,
  isLoading = false,
  formatValue = (v) => v.toLocaleString(),
  formatSecondaryValue,
  colorTheme = "blue",
  showSecondaryValue = false,
  emptyMessage = "No data available",
}: CSSBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const theme = colorThemes[colorTheme];

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-7 bg-gray-100 rounded-lg" style={{ width: `${100 - i * 15}%` }} />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => {
              const percentage = Math.max((item.value / maxValue) * 100, 3);
              return (
                <div
                  key={index}
                  className="group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-sm text-gray-700 font-medium truncate max-w-[55%] group-hover:text-gray-900 transition-colors"
                      title={item.label}
                    >
                      {item.label || "(empty)"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${theme.text}`}>
                        {formatValue(item.value)}
                      </span>
                      {showSecondaryValue && item.secondaryValue !== undefined && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {formatSecondaryValue
                            ? formatSecondaryValue(item.secondaryValue)
                            : item.secondaryValue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${theme.gradient} rounded-lg transition-all duration-700 ease-out group-hover:brightness-110`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Shine effect */}
                    <div
                      className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
