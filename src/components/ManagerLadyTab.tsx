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
  newYlIkutJht?: boolean;
  setNewYlIkutJht?: (val: boolean) => void;
  newYlIuranJht?: number;
  setNewYlIuranJht?: (val: number) => void;
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
  newYlIkutJht = true,
  setNewYlIkutJht,
  newYlIuranJht = 24000,
  setNewYlIuranJht,
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
                <th className="p-3 text-center min-w-[170px]">Iuran JHT</th>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 items-end">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Area</label>
              <input
                type="text"
                placeholder="mis: 211"
                value={newYlArea}
                onChange={(e) => setNewYlArea(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Kode YL</label>
              <input
                type="text"
                placeholder="mis: YL-211"
                value={newYlKode}
                onChange={(e) => setNewYlKode(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Nama YL</label>
              <input
                type="text"
                placeholder="mis: Rahmawati"
                value={newYlNama}
                onChange={(e) => setNewYlNama(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-700 block mb-1 flex items-center gap-1">
                <span>📅 Tgl Masuk</span>
              </label>
              <input
                type="date"
                value={newYlTanggalMasuk}
                onChange={(e) => setNewYlTanggalMasuk(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 focus:border-emerald-500 cursor-pointer min-h-[36px]"
                style={{ colorScheme: "light" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">PIN Login</label>
              <input
                type="text"
                placeholder="mis: 211"
                value={newYlPin}
                onChange={(e) => setNewYlPin(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">NIK (opsional)</label>
              <input
                type="text"
                placeholder="350xxx"
                value={newYlNik}
                onChange={(e) => setNewYlNik(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-700 block mb-1 flex items-center gap-1">
                <span>🎂 Tgl Lahir</span>
              </label>
              <input
                type="date"
                value={newYlTglLahir}
                onChange={(e) => setNewYlTglLahir(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-900 focus:border-emerald-500 cursor-pointer min-h-[36px]"
                style={{ colorScheme: "light" }}
              />
            </div>
            {/* Input & Toggle Iuran JHT */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Iuran JHT</label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2 py-1 min-h-[36px]">
                <button
                  type="button"
                  onClick={() => setNewYlIkutJht && setNewYlIkutJht(!newYlIkutJht)}
                  className={`text-[10px] font-black px-2 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                    newYlIkutJht
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200"
                  }`}
                  title={newYlIkutJht ? "Status: Ikut Program JHT" : "Status: Tidak Ikut JHT"}
                >
                  {newYlIkutJht ? "✓ Ikut" : "✕ Tidak"}
                </button>
                <div className="relative flex-1">
                  <span className="absolute left-1 top-1 text-[10px] text-slate-400 font-bold pointer-events-none">Rp</span>
                  <input
                    type="number"
                    step={1000}
                    min={0}
                    disabled={!newYlIkutJht}
                    value={newYlIkutJht ? newYlIuranJht : 0}
                    onChange={(e) => setNewYlIuranJht && setNewYlIuranJht(parseInt(e.target.value, 10) || 0)}
                    placeholder="24000"
                    className={`w-full pl-6 pr-1 py-0.5 text-xs font-mono font-bold outline-none text-right rounded ${
                      !newYlIkutJht ? "text-slate-400 cursor-not-allowed bg-slate-50" : "text-slate-900 bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>
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
