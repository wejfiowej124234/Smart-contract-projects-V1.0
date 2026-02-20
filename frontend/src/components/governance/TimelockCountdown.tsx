import { useState, useEffect } from "react";
import { governanceTimelockEta } from "../../config/ui";

type TimelockCountdownProps = {
  eta: number | null;
};

function formatEtaDate(eta: number): string {
  const d = new Date(eta * 1000);
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function formatCountdown(eta: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, eta - now);
  if (diff <= 0) return "Executable now";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 24) return `Executable at ${formatEtaDate(eta)}`;
  if (h > 0) return `Executable in ${h}h ${m}m`;
  return `Executable in ${m}m`;
}

export function TimelockCountdown({ eta }: TimelockCountdownProps) {
  const [text, setText] = useState<string>(() => (eta != null && eta > 0 ? formatCountdown(eta) : "—"));

  useEffect(() => {
    if (eta == null || eta <= 0) {
      queueMicrotask(() => setText("—"));
      return;
    }
    queueMicrotask(() => setText(formatCountdown(eta)));
    const t = setInterval(() => setText(formatCountdown(eta)), 60_000);
    return () => clearInterval(t);
  }, [eta]);

  if (eta == null || eta <= 0) return <span className="timelockCountdown">—</span>;

  return (
    <span className="timelockCountdown" title={`${governanceTimelockEta}: ${formatEtaDate(eta)}`}>
      {text}
    </span>
  );
}
