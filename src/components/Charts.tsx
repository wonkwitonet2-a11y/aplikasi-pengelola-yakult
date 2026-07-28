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
}

export const RankingYLChart = memo(function RankingYLChart({ data = [] }: RankingYLProps) {
  const sortedData = [...(data || [])].sort((a, b) => b.akumulasi - a.akumulasi);

  const chartHeight = Math.max(220, sortedData.length * 36);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" stroke="#94a3b8" fontSize={10} />
          <YAxis
            dataKey="nama"
            type="category"
            stroke="#94a3b8"
            fontSize={10}
            width={150}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
            labelClassName="text-slate-200 font-bold"
            formatter={(value: any) => [`${value} btl`, "Akumulasi"]}
          />
          <Bar dataKey="akumulasi" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="akumulasi" position="right" fontSize={10} fill="#64748b" fontWeight="bold" />
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
}

export const KomposisiProdukChart = memo(function KomposisiProdukChart({ yo, om, os, yt }: KomposisiProps) {
  const total = yo + om + os + yt;
  const data = [
    { name: "YO Original", value: yo, color: "#ef4444" },
    { name: "OM Mango", value: om, color: "#f59e0b" },
    { name: "OS Stroberi", value: os, color: "#ec4899" },
    { name: "YT Light", value: yt, color: "#3b82f6" }
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col items-center justify-center h-[200px] w-full">
      <div className="h-[140px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
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
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          <span className="text-sm font-black text-slate-800">{total.toLocaleString("id-ID")} btl</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-[10px] mt-2 px-4">
        {data.map((entry, index) => {
          const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div key={index} className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 truncate">{entry.name}</span>
              <span className="text-slate-400 ml-auto font-bold">{percentage}%</span>
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

export const TargetVsActualChart = memo(function TargetVsActualChart({ data = [] }: TargetVsActualProps) {
  const sortedData = [...(data || [])].sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="h-[220px] w-full">
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
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
            labelClassName="text-slate-200 font-bold"
          />
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
    <div className="h-[220px] w-full">
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
    <div className="flex flex-col gap-2 w-full">
      <div className="h-[340px] w-full">
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

      {/* Legend / Keterangan Warna & Bentuk Grafik */}
      <div className="mt-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-700">
        <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
          📌 Keterangan Grafis Tren:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[3px] bg-red-600 rounded-full inline-block shrink-0"></span>
            <span><strong className="text-red-700">Merah Solid:</strong> Penjualan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-blue-500/20 border border-blue-600 rounded-sm inline-block shrink-0"></span>
            <span><strong className="text-blue-700">Batang Biru:</strong> Balik Botol (BB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t-2 border-dashed border-emerald-500 inline-block shrink-0"></span>
            <span><strong className="text-emerald-700">Putus Hijau:</strong> Target Bulan Ini</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-amber-500 rounded-full inline-block shrink-0"></span>
            <span><strong className="text-amber-700">Oranye Solid:</strong> Bulan Lalu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t border-dotted border-purple-600 inline-block shrink-0"></span>
            <span><strong className="text-purple-700">Bintik Ungu:</strong> Tahun Lalu</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-200/60 pt-1">
          * Catatan Target: Nilai target harian disesuaikan dengan lompatan hari antar transaksi (lompatan 2 hari target dikali 2, lompatan 3 hari target dikali 3).
        </p>
      </div>
    </div>
  );
});
