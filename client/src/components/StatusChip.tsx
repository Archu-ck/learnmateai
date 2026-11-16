type StatusChipProps = {
  status: string;
  size?: "sm" | "md";
};

const statusStyles: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  "Pending": {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200/60",
  },
  "In Progress": {
    bg: "bg-indigo-500/10",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    border: "border-indigo-200/60",
  },
  "Submitted": {
    bg: "bg-sky-500/10",
    text: "text-sky-700",
    dot: "bg-sky-500",
    border: "border-sky-200/60",
  },
  "Graded": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60",
  },
  "Completed": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60",
  },
  "On Track": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60",
  },
  "Needs Attention": {
    bg: "bg-orange-500/10",
    text: "text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-200/60",
  },
  "At Risk": {
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200/60",
  },
  "Present": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60",
  },
  "Absent": {
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200/60",
  },
  "Late": {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200/60",
  },
  "Active": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200/60",
  },
  "Inactive": {
    bg: "bg-slate-500/10",
    text: "text-slate-500",
    dot: "bg-slate-400",
    border: "border-slate-200/60",
  },
  "Overdue": {
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200/60",
  },
};

const defaultStyle = {
  bg: "bg-slate-500/10",
  text: "text-slate-600",
  dot: "bg-slate-400",
  border: "border-slate-200/60",
};

export default function StatusChip({ status, size = "sm" }: StatusChipProps) {
  const style = statusStyles[status] || defaultStyle;
  const sizeClasses =
    size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-sm shadow-xs ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{status}</span>
    </span>
  );
}
