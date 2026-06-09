export function StatusPill({
  value,
  tone
}: {
  value: string;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const resolvedTone = tone ?? toneForValue(value);
  return <span className={`pill ${resolvedTone}`}>{value.replaceAll("_", " ")}</span>;
}

function toneForValue(value: string) {
  if (value === "CRITICAL" || value === "HIGH" || value === "ESCALATED") {
    return "danger";
  }

  if (value === "OPEN" || value === "IN_REVIEW" || value === "MEDIUM") {
    return "warning";
  }

  if (value === "RESOLVED" || value === "DISMISSED" || value === "LOW") {
    return "success";
  }

  return "neutral";
}
