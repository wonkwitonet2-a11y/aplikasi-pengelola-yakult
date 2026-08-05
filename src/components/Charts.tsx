import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  LabelList
} from "recharts";

// 1. Ranking Penjualan Antar YL (Bulan Ini) - Horizontal Bar Chart
interface RankingYLProps {
  data: { nama: string; akumulasi: number }[];
  isCompact?: boolean;
  height?: string | number;
}

const CustomRankingTooltip = ({ active, payload, sortedData }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const value = Number(item.akumulasi || 0);
    const rankIndex = (sortedData || []).findIndex((d: any) => d.nama === item.nama);
    const rankNumber = rankIndex >= 0 ? rankIndex + 1 : null;

    let badgeBg = "bg-slate-800 text-slate-300";
    let badgeText = rankNumber ? `#${rankNumber}` : "";
    if (rankNumber === 1) {
      badgeBg = "bg-amber-400 text-slate-950 font-black";
      badgeText = "🥇 Juara 1";
    } else if (rankNumber === 2) {
      badgeBg = "bg-red-500 text-white font-bold";
      badgeText = "🥈 Juara 2";
    } else if (rankNumber === 3) {
      badgeBg = "bg-rose-400 text-slate-950 font-bold";
      badgeText = "🥉 Juara 3";
    }

    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 text-xs shadow-2xl min-w-[180px] z-50 space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
          <span className="font-black text-white text-sm">{item.nama}</span>
          {badgeText && (
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${badgeBg}`}>
              {badgeText}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 text-xs pt-0.5">
          <span className="text-slate-300 font-medium">Akumulasi Penjualan:</span>
          <span className="font-black text-amber-400 font-mono text-sm">
            {value.toLocaleString("id-ID")} btl
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const RankingYLChart = memo(function RankingYLChart({ data = [], isCompact = false, height }: RankingYLProps) {
  const sortedData = [...(data || [])].sort((a, b) => b.akumulasi - a.akumulasi);

  const calculatedHeight = Math.max(260, sortedData.length * 28);
  const containerStyle = height
    ? { height }
    : isCompact
    ? { height: "100%", minHeight: calculatedHeight }
    : { height: calculatedHeight };

  return (
    <div className="w-full h-full" style={containerStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 2, right: 35, left: 5, bottom: 2 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" stroke="#94a3b8" fontSize={9} />
          <YAxis
            dataKey="nama"
            type="category"
            stroke="#475569"
            fontSize={isCompact ? 9 : 10}
            fontWeight={600}
            width={isCompact ? 105 : 120}
            tickLine={false}
            interval={0}
          />
          <Tooltip content={(props) => <CustomRankingTooltip {...props} sortedData={sortedData} />} />
          <Bar dataKey="akumulasi" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="akumulasi" position="right" fontSize={9} fill="#64748b" fontWeight="bold" />
            {sortedData.map((_, index) => {
              // Custom coloring for top spots
              let color = "#fee2e2"; // Default light red
              if (index === 0) color = "#eab308"; // Gold
              else if (index === 1) color = "#dc2626"; // Crimson Red
              else if (index === 2) color = "#f87171"; // Rose Red
              else color = "#fca5a5";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// 2. Komposisi Produk - Donut Chart
interface KomposisiProps {
  yo: number;
  om: number;
  os: number;
  yt: number;
  height?: number;
}

export const KomposisiProdukChart = memo(function KomposisiProdukChart({ yo, om, os, yt, height }: KomposisiProps) {
  const total = yo + om + os + yt;
  const data = [
    { name: "YO Original", value: yo, color: "#ef4444" },
    { name: "OM Mango", value: om, color: "#f59e0b" },
    { name: "OS Stroberi", value: os, color: "#ec4899" },
    { name: "YT Light", value: yt, color: "#3b82f6" }
  ].filter(d => d.value > 0);

  const containerHeight = height || 220;
  const pieRadiusOuter = Math.min(110, Math.max(55, Math.floor(containerHeight * 0.22)));
  const pieRadiusInner = Math.floor(pieRadiusOuter * 0.62);

  return (
    <div
      className="flex flex-col items-center justify-between w-full"
      style={{ height: containerHeight }}
    >
      <div className="w-full relative flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={pieRadiusInner}
              outerRadius={pieRadiusOuter}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value} btl`, "Jumlah"]}
              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total</span>
          <span className="text-sm sm:text-base font-black text-slate-800">{total.toLocaleString("id-ID")} btl</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[10px] sm:text-xs pt-2 pb-1 px-4 border-t border-slate-100/80 bg-slate-50/50 rounded-xl">
        {data.map((entry, index) => {
          const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div key={index} className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-700 truncate font-semibold">{entry.name}</span>
              <span className="text-slate-500 ml-auto font-bold">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// 3. Target vs Actual per YL - Grouped Bar Chart
interface TargetVsActualProps {
  data: { nama: string; target: number; actual: number }[];
}

const CustomTargetVsActualTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const targetItem = payload.find((p: any) => p.dataKey === "target");
    const actualItem = payload.find((p: any) => p.dataKey === "actual");
    const targetVal = Number(targetItem?.value || 0);
    const actualVal = Number(actualItem?.value || 0);
    const pct = targetVal > 0 ? Math.round((actualVal / targetVal) * 100) : 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 text-xs shadow-2xl min-w-[170px] z-50 space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
          <span className="font-black text-white text-sm">{label}</span>
          <span className="text-[10px] bg-slate-800 text-amber-400 font-black px-2 py-0.5 rounded">
            {pct}% Capaian
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-300"></span> Target:
            </span>
            <span className="font-bold text-white font-mono">{targetVal.toLocaleString("id-ID")} btl</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-600"></span> Realisasi:
            </span>
            <span className="font-black text-emerald-400 font-mono">{actualVal.toLocaleString("id-ID")} btl</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const TargetVsActualChart = memo(function TargetVsActualChart({ data = [] }: TargetVsActualProps) {
  const sortedData = [...(data || [])].sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="w-full h-[220px] sm:h-[260px] min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="nama"
            stroke="#94a3b8"
            fontSize={8}
            tickLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis stroke="#94a3b8" fontSize={9} />
          <Tooltip content={<CustomTargetVsActualTooltip />} />
          <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
          <Bar dataKey="target" name="Target" fill="#fca5a5" radius={[3, 3, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#dc2626" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// 4. Potensi Sektor Tim - Sektor Bar Chart
interface SektorProps {
  data: { name: string; value: number; color: string }[];
}

const CustomSektorTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-2.5 rounded-lg border border-slate-700 text-xs shadow-xl min-w-[150px] z-50">
        <p className="font-bold text-amber-400 mb-1.5 pb-1 border-b border-slate-700/80 flex items-center justify-between gap-2">
          <span>Sektor:</span>
          <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-semibold">{item.name}</span>
        </p>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300 font-medium">Penjualan:</span>
            <span className="font-bold text-white font-mono">
              {Number(item.value || 0).toLocaleString("id-ID")} btl
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const SektorTimChart = memo(function SektorTimChart({ data = [] }: SektorProps) {
  return (
    <div className="w-full h-[220px] sm:h-[260px] min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data || []}
          layout="vertical"
          margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            stroke="#64748b"
            fontSize={10}
            tickFormatter={(v) => Number(v).toLocaleString("id-ID")}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#475569"
            fontSize={10}
            fontWeight={600}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomSektorTooltip />} />
          <Bar dataKey="value" name="Volume" radius={[0, 4, 4, 0]}>
            {(data || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// 5. Tren Harian: Penjualan - Combo Chart (Dual Y-Axis)
interface TrenDataPoint {
  tanggal: string;
  penjualan: number;
  balikBotol: number;
  target?: number;
  bulanLalu?: number;
  tahunLalu?: number;
}

interface TrenProps {
  data: TrenDataPoint[];
}

const CustomTrenTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md p-2.5 rounded-lg border border-slate-700 text-xs shadow-xl min-w-[170px] z-50">
        <p className="font-bold text-amber-400 mb-1.5 pb-1 border-b border-slate-700/80 flex items-center justify-between">
          <span>Tanggal:</span>
          <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded">{label}</span>
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((item: any, idx: number) => {
            let dotColor = item.color || item.fill || item.stroke;
            if (item.dataKey === "penjualan") dotColor = "#ef4444";
            else if (item.dataKey === "balikBotol") dotColor = "#38bdf8";
            else if (item.dataKey === "target") dotColor = "#34d399";
            else if (item.dataKey === "bulanLalu") dotColor = "#fbbf24";
            else if (item.dataKey === "tahunLalu") dotColor = "#c084fc";

            return (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: dotColor }}></span>
                  <span className="text-slate-300 font-medium">{item.name}:</span>
                </div>
                <span className="font-bold text-white font-mono">
                  {Number(item.value ?? 0).toLocaleString("id-ID")} btl
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const TrenHarianChart = memo(function TrenHarianChart({ data }: TrenProps) {
  // Calculated flexible Y max: max value + 20%, rounded to nearest thousands (e.g., 14,138 -> 14,000)
  const calcFlexibleYMax = (dataMax: number) => {
    if (!Number.isFinite(dataMax) || dataMax <= 0) return 1000;
    const targetVal = dataMax * 1.2;
    if (targetVal >= 10000) {
      return Math.round(targetVal / 1000) * 1000;
    }
    if (targetVal >= 1000) {
      return Math.round(targetVal / 100) * 100;
    }
    return Math.ceil(targetVal);
  };

  return (
    <div className="flex flex-col gap-2 w-full h-[220px] sm:h-[260px] min-h-[200px]">
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 15, right: 10, left: 15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} fontWeight={600} />
            
            {/* Sumbu Y Tunggal (Flexible + 20% Rounded) */}
            <YAxis
              stroke="#64748b"
              fontSize={10}
              fontWeight={600}
              width={48}
              domain={[0, calcFlexibleYMax]}
              padding={{ top: 20, bottom: 10 }}
              tickFormatter={(v) => Number(v).toLocaleString("id-ID")}
            />

            <Tooltip content={<CustomTrenTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />

            {/* 1. Balik Botol (BB): Bar Chart Transparan */}
            <Bar
              dataKey="balikBotol"
              name="Balik Botol (BB)"
              fill="rgba(59, 130, 246, 0.25)"
              stroke="#2563eb"
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
            />

            {/* 2. Penjualan: Garis Merah Tebal Solid */}
            <Line
              type="monotone"
              dataKey="penjualan"
              name="Penjualan"
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ r: 3.5, fill: "#dc2626", strokeWidth: 1.5, stroke: "#ffffff" }}
              activeDot={{ r: 5 }}
            />

            {/* 3. Target: Garis Hijau Putus-Putus (Dashed) */}
            <Line
              type="monotone"
              dataKey="target"
              name="Target Bulan Ini"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* 4. Bulan Lalu: Garis Oranye Tipis Solid */}
            <Line
              type="monotone"
              dataKey="bulanLalu"
              name="Bulan Lalu"
              stroke="#f59e0b"
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* 5. Tahun Lalu: Garis Ungu Bintik-Bintik (Dotted) */}
            <Line
              type="monotone"
              dataKey="tahunLalu"
              name="Tahun Lalu"
              stroke="#9333ea"
              strokeWidth={1.8}
              strokeDasharray="2 3"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
