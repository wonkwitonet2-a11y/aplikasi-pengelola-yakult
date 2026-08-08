import React from "react";
import { YlProfileRow } from "./YlProfileRow";

interface ManagerLadyTabProps {
  ylList: any[];
  setYlList: React.Dispatch<React.SetStateAction<any[]>>;
  handleSaveYlList: (listToSave?: any[]) => Promise<void>;
  handleDeleteYl: (area: string) => Promise<void>;
  handleAddYl: () => Promise<void>;
  newYlArea: string;
  setNewYlArea: (val: string) => void;
  newYlKode: string;
  setNewYlKode: (val: string) => void;
  newYlNama: string;
  setNewYlNama: (val: string) => void;
  newYlTanggalMasuk: string;
  setNewYlTanggalMasuk: (val: string) => void;
  newYlPin: string;
  setNewYlPin: (val: string) => void;
  newYlNik: string;
  setNewYlNik: (val: string) => void;
  newYlTglLahir: string;
  setNewYlTglLahir: (val: string) => void;
  ylSavedMsg: string | null;
}

function ManagerLadyTabInner({
  ylList,
  setYlList,
  handleSaveYlList,
  handleDeleteYl,
  handleAddYl,
  newYlArea,
  setNewYlArea,
  newYlKode,
  setNewYlKode,
  newYlNama,
  setNewYlNama,
  newYlTanggalMasuk,
  setNewYlTanggalMasuk,
  newYlPin,
  setNewYlPin,
  newYlNik,
  setNewYlNik,
  newYlTglLahir,
  setNewYlTglLahir,
  ylSavedMsg,
}: ManagerLadyTabProps) {
  return (
    <div className="space-y-6">
      {/* KELOLA PROFIL & STATUS YL */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-l-4 border-red-600 pl-2">
          <div>
            <h2 className="text-xs font-black text-red-950 uppercase tracking-wider">
              👥 Kelola Profil & Status Yakult Lady (YL)
            </h2>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
              Kelola nama lengkap, PIN login, status keaktifan/resign, serta pendaftaran YL baru. Tombol Hapus akan menghapus YL secara permanen dari seluruh sistem.
            </p>
          </div>
          <span className="text-[10px] font-black bg-red-100 text-red-800 px-2.5 py-1 rounded-lg">
            Total: {ylList.length} YL ({ylList.filter((y) => y.status !== "Resign").length} Aktif)
          </span>
        </div>

        {/* Table of YLs */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto border-2 border-slate-300 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-900 text-slate-100 font-black uppercase text-xs sticky top-0 z-10 border-b-2 border-slate-800 divide-x divide-slate-700">
                <th className="p-3 w-20 text-center">Area</th>
                <th className="p-3 w-28">Kode YL</th>
                <th className="p-3 min-w-[240px] w-72">Nama Lengkap YL</th>
                <th className="p-3 text-center min-w-[140px]">Tanggal Masuk</th>
                <th className="p-3 text-center min-w-[100px]">PIN Login</th>
                <th className="p-3 text-center min-w-[100px]">NIK</th>
                <th className="p-3 text-center min-w-[100px]">Tgl Lahir</th>
                <th className="p-3 text-center min-w-[100px]">Status</th>
                <th className="p-3 text-right min-w-[160px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold">
              {ylList.map((yl: any, idx) => (
                <YlProfileRow
                  key={idx}
                  yl={yl}
                  idx={idx}
                  ylList={ylList}
                  setYlList={setYlList}
                  handleSaveYlList={handleSaveYlList}
                  handleDeleteYl={handleDeleteYl}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Input / Mendaftar YL Baru */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider block border-l-3 border-emerald-600 pl-2">
            ➕ Mendaftar Yakult Lady (YL) Baru
          </span>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="Area (mis: 211)"
              value={newYlArea}
              onChange={(e) => setNewYlArea(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Kode YL (mis: YL-211)"
              value={newYlKode}
              onChange={(e) => setNewYlKode(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 font-mono"
            />
            <input
              type="text"
              placeholder="Nama YL (mis: Rahmawati)"
              value={newYlNama}
              onChange={(e) => setNewYlNama(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
            />
            <input
              type="date"
              value={newYlTanggalMasuk}
              onChange={(e) => setNewYlTanggalMasuk(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="PIN (mis: 211)"
              value={newYlPin}
              onChange={(e) => setNewYlPin(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 font-mono"
            />
            <input
              type="text"
              placeholder="NIK (opsional)"
              value={newYlNik}
              onChange={(e) => setNewYlNik(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
            />
            <input
              type="date"
              placeholder="Tgl Lahir"
              value={newYlTglLahir}
              onChange={(e) => setNewYlTglLahir(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleAddYl}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
          >
            💾 Simpan Pendaftaran YL Baru
          </button>
        </div>

        <button
          onClick={() => handleSaveYlList(ylList)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5"
        >
          💾 Simpan Perubahan Table Profil YL & PIN
        </button>
        {ylSavedMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-black text-emerald-700 text-center animate-pulse">
            {ylSavedMsg}
          </div>
        )}
      </div>
    </div>
  );
}

export const ManagerLadyTab = React.memo(ManagerLadyTabInner);
