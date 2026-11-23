import type { CourseStatus } from "../lib/types";
import "./StatusBadge.css";

const LABELS: Record<Exclude<CourseStatus, "normal">, string> = {
  remplace: "Remplacé",
  controle: "Contrôle",
  annule: "Annulé",
};

export function StatusBadge({ status }: { status: CourseStatus | undefined }) {
  if (!status || status === "normal") return null;
  return <span className={`status-badge status-badge--${status}`}>{LABELS[status]}</span>;
}
