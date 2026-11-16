import { type ReactNode, isValidElement } from "react";

type LucideIconType = React.ComponentType<{ size?: number; className?: string }>;

type StatCardProps = {
  label?: string;
  title?: string;
  value: string | number;
  icon?: ReactNode | LucideIconType;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  colorScheme?: "indigo" | "coral" | "emerald" | "amber" | "sky" | "purple";
};

const colorGradients = {
  indigo: "from-indigo-500 to-violet-500 shadow-indigo-500/20",
  coral: "from-rose-400 to-coral-500 shadow-rose-400/20",
  emerald: "from-emerald-400 to-teal-500 shadow-emerald-400/20",
  amber: "from-amber-400 to-orange-400 shadow-amber-400/20",
  sky: "from-sky-400 to-blue-500 shadow-sky-400/20",
  purple: "from-purple-400 to-indigo-500 shadow-purple-400/20",
};

export default function StatCard({
  label,
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  subtitle,
  colorScheme = "indigo",
}: StatCardProps) {
  const displayLabel = label || title || "";

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const IconComp = icon as LucideIconType;
      return <IconComp size={20} className="text-white" />;
    }
    return null;
  };

  const gradientClass = colorGradients[colorScheme] || colorGradients.indigo;

  return (
    <div className="neu-card p-5 sm:p-6 group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">
            {displayLabel}
          </p>
          <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {value}
          </p>

          {change && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center ${
                  changeType === "positive"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200/50"
                    : changeType === "negative"
                    ? "bg-rose-500/10 text-rose-600 border border-rose-200/50"
                    : "bg-slate-500/10 text-slate-600 border border-slate-200/50"
                }`}
              >
                {change}
              </span>
            </div>
          )}

          {subtitle && !change && (
            <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform`}
          >
            {renderIcon()}
          </div>
        )}
      </div>
    </div>
  );
}
