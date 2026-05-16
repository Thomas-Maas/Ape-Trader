"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  CrosshairMode,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/utils/binance";

type Props = {
  data: Candle[];
};

function normalize(data: Candle[]): LineData<UTCTimestamp>[] {
  const byTime = new Map<number, LineData<UTCTimestamp>>();
  for (const c of data) {
    const time = Math.floor(c.time / 1000) as UTCTimestamp;
    byTime.set(time, { time, value: c.close });
  }
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

export default function CryptoChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "#111827" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: "#374151",
      },
      rightPriceScale: { borderColor: "#374151" },
      crosshair: { mode: CrosshairMode.Hidden },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color: "#22d3ee",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  const normalized = useMemo(() => normalize(data), [data]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    series.setData(normalized);
    if (normalized.length > 0) {
      chart.timeScale().fitContent();
    }
  }, [normalized]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
      <div className="border-b border-gray-700 px-4 py-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          BTC/USDT — {data.length} ticks
        </h2>
      </div>
      <div ref={containerRef} className="h-80 w-full" />
    </div>
  );
}
