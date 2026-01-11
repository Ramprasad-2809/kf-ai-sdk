import { Card, CardContent } from "../ui/card";

type AccentColor = "blue" | "red" | "green" | "orange" | "purple" | "indigo";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  valueClassName?: string;
  accent?: AccentColor;
  trend?: {
    value: number;
    label?: string;
  };
}

const accentStyles: Record<AccentColor, { bg: string; icon: string; border: string }> = {
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    icon: "bg-blue-500 text-white shadow-blue-200",
    border: "border-t-blue-500",
  },
  red: {
    bg: "bg-gradient-to-br from-red-50 to-red-100",
    icon: "bg-red-500 text-white shadow-red-200",
    border: "border-t-red-500",
  },
  green: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    icon: "bg-emerald-500 text-white shadow-emerald-200",
    border: "border-t-emerald-500",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-50 to-orange-100",
    icon: "bg-orange-500 text-white shadow-orange-200",
    border: "border-t-orange-500",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-50 to-purple-100",
    icon: "bg-purple-500 text-white shadow-purple-200",
    border: "border-t-purple-500",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    icon: "bg-indigo-500 text-white shadow-indigo-200",
    border: "border-t-indigo-500",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  isLoading = false,
  valueClassName = "",
  accent = "blue",
  trend,
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card className={`overflow-hidden border-t-4 ${styles.border} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="p-0">
        <div className={`${styles.bg} p-5`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {isLoading ? (
                <div className="mt-3 space-y-2">
                  <div className="h-9 w-28 bg-white/60 rounded-lg animate-pulse" />
                  {subtitle && (
                    <div className="h-4 w-20 bg-white/40 rounded animate-pulse" />
                  )}
                </div>
              ) : (
                <>
                  <p className={`mt-3 text-3xl font-bold tracking-tight text-gray-900 ${valueClassName}`}>
                    {value}
                  </p>
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                  )}
                  {trend && (
                    <div className="mt-2 flex items-center gap-1">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          trend.value >= 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {trend.value >= 0 ? "+" : ""}
                        {trend.value}%
                      </span>
                      {trend.label && (
                        <span className="text-xs text-gray-500">{trend.label}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {icon && (
              <div className={`flex-shrink-0 p-3 rounded-xl shadow-lg ${styles.icon}`}>
                {icon}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
