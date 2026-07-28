import React from "react";
import { Trash2 } from "lucide-react";
import { cleanYlName } from "../types";

interface YlProfileRowProps {
  yl: any;
  idx: number;
  ylList: any[];
  setYlList: (list: any[]) => void;
  handleSaveYlList: (newList: any) => void;
  handleDeleteYl: (idx: number) => void;
}

// One row of the "Profil YL" management table (kode, nama, tanggal masuk,
// PIN, status, aksi). Extracted from ManagerView and memoized for the same
// reason as BreakdownGridRow / TargetManagerRow: so editing one YL's row
// doesn't force React to re-check every other YL row too.
function YlProfileRowInner({
  yl,
  idx,
  ylList,
  setYlList,
  handleSaveYlList,
  handleDeleteYl,
}: YlProfileRowProps) {
  const isResign = yl.status === "Resign";

  return (
    <tr className={`hover:bg-amber-50/50 transition-colors ${isResign ? "bg-rose-50/40 text-slate-400" : ""}`}>
      <td className="p-2.5 text-center text-red-700 font-black text-xs sm:text-sm">{yl.area}</td>
      <td className="p-2.5">
        <input
          type="text"
          value={yl.kodeYl || `YL-${yl.area}`}
          onChange={(e) => {
            const copy = [...ylList];
            copy[idx].kodeYl = e.target.value;
            setYlList(copy);
          }}
          className="p-1.5 text-xs bg-slate-50 border border-slate-300 rounded outline-none font-mono w-28 text-slate-900 font-bold focus:border-red-500 focus:bg-white"
        />
      </td>
      <td className="p-2.5 min-w-[240px]">
        <input
          type="text"
          value={cleanYlName(yl.nama)}
          onChange={(e) => {
            const copy = [...ylList];
            copy[idx].nama = e.target.value;
            setYlList(copy);
          }}
          placeholder="Nama Lengkap YL"
          className={`p-1.5 text-xs sm:text-sm border rounded outline-none font-black w-full min-w-[220px] text-slate-900 focus:border-red-500 focus:bg-white ${isResign ? "bg-rose-100/50 border-rose-200 text-slate-500 line-through" : "bg-slate-50 border-slate-300"}`}
        />
      </td>
      <td className="p-2.5 text-center">
        <input
          type="date"
          value={yl.tanggalMasuk || yl.tanggalDaftar || ""}
          onChange={(e) => {
            const copy = [...ylList];
            copy[idx].tanggalMasuk = e.target.value;
            setYlList(copy);
          }}
          className="p-1.5 text-xs bg-slate-50 border border-slate-300 rounded outline-none font-bold text-slate-900 focus:border-red-500 focus:bg-white"
        />
      </td>
      <td className="p-2.5 text-center">
        <input
          type="text"
          maxLength={6}
          value={yl.pin}
          onChange={(e) => {
            const copy = [...ylList];
            copy[idx].pin = e.target.value;
            setYlList(copy);
          }}
          className="p-1.5 text-xs bg-slate-50 border border-slate-300 rounded outline-none text-center font-mono w-20 text-slate-900 font-bold focus:border-red-500 focus:bg-white"
        />
      </td>
      <td className="p-2.5 text-center">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isResign ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"}`}>
          {isResign ? "Resign" : "Aktif"}
        </span>
      </td>
      <td className="p-2.5 text-right space-x-2">
        <button
          onClick={() => {
            const copy = [...ylList];
            if (isResign) {
              copy[idx].status = "Aktif";
              delete copy[idx].tanggalResign;
            } else {
              copy[idx].status = "Resign";
              copy[idx].tanggalResign = new Date().toISOString().split("T")[0];
            }
            setYlList(copy);
            handleSaveYlList(copy);
          }}
          className={`text-[10px] font-bold border px-2 py-1 rounded transition-colors ${isResign ? "text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100" : "text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100"}`}
        >
          {isResign ? "Aktifkan" : "Tandai Resign"}
        </button>
        <button
          onClick={() => handleDeleteYl(idx)}
          className="text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer inline-flex items-center gap-1"
          title="Hapus YL Permanen"
        >
          <Trash2 className="w-3 h-3" />
          <span>Hapus</span>
        </button>
      </td>
    </tr>
  );
}

export const YlProfileRow = React.memo(YlProfileRowInner);
