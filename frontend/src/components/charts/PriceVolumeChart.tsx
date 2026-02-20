import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
} from "recharts";
import {
  chartPriceLabel,
  chartVolumeLabel,
  chartTimeRange1d,
  chartTimeRange1w,
  chartTimeRange1y,
  marketsChartTitleSimulated,
  chartSimulatedDataLabel,
  chartSimulatedBadgeShort,
  chartRateModelSimulatedCaption,
  marketsChartDataSourceExplanation,
} from "../../config/ui";

/** Simulated OHLC-style data point for chart (price + volume). */
type DataPoint = { time: string; price: number; volume: number };

/** Generates mock time series for demo (price + volume). */
function generateMockData(range: "1d" | "1w" | "1y"): DataPoint[] {
  const points = range === "1d" ? 24 : range === "1w" ? 42 : 52;
  const basePrice = 1.0;
  const data: DataPoint[] = [];
  let p = basePrice;
  for (let i = 0; i < points; i++) {
    p = p + (Math.random() - 0.48) * 0.02;
    p = Math.max(0.98, Math.min(1.02, p));
    const volume = Math.round(10000 + Math.random() * 50000);
    const label = range === "1d" ? `${i}:00` : range === "1w" ? `D${i}` : `W${i}`;
    data.push({ time: label, price: Math.round(p * 1000) / 1000, volume });
  }
  return data;
}

type TimeRange = "1d" | "1w" | "1y";

export function PriceVolumeChart() {
  const [range, setRange] = useState<TimeRange>("1w");
  const data = useMemo(() => generateMockData(range), [range]);

  return (
    <div className="card chartCard">
      <div className="chartHeader">
        <h3 className="chartTitle">{marketsChartTitleSimulated}</h3>
        <span className="chartSimulatedBadge" title={chartRateModelSimulatedCaption} aria-label={chartSimulatedDataLabel}>
          {chartSimulatedBadgeShort}
        </span>
        <div className="chartTimeRange" role="tablist" aria-label="Time range">
          {([["1d", chartTimeRange1d], ["1w", chartTimeRange1w], ["1y", chartTimeRange1y]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={range === v}
              className={`chartTimeBtn ${range === v ? "active" : ""}`}
              onClick={() => setRange(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="chartWrapper">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
            <XAxis dataKey="time" tick={{ fill: "var(--color-textMuted)", fontSize: 10 }} />
            <YAxis
              yAxisId="price"
              orientation="left"
              tick={{ fill: "var(--color-textMuted)", fontSize: 10 }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => String(v)}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fill: "var(--color-textMuted)", fontSize: 10 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
              labelStyle={{ color: "var(--color-text)" }}
              formatter={(value, name) => [value == null ? "—" : (String(name) === "price" ? value : Number(value).toLocaleString()), String(name) === "price" ? chartPriceLabel : chartVolumeLabel]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.15}
              strokeWidth={2}
              name="price"
            />
            <Bar yAxisId="volume" dataKey="volume" fill="var(--color-primary)" fillOpacity={0.35} name="volume" radius={[2, 2, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="chartSimulatedCaption muted" role="note">
        {chartRateModelSimulatedCaption}
      </p>
      <p className="chartDataSourceHint muted" role="note" title={marketsChartDataSourceExplanation}>
        {marketsChartDataSourceExplanation}
      </p>
    </div>
  );
}
