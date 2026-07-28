import React from "react";
import { YlProfileRow } from "./YlProfileRow";

interface ManagerLadyTabProps {
  ylList: any[];
  setYlList: React.Dispatch<React.SetStateAction<any[]>>;
  names: string[];
  selectedYLArea: string;
  setSelectedYLArea: (area: string) => void;
  ylDetail: any;
  dashboardData: any;
  formatRp: (num: number) => string;
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
  ylSavedMsg: string | null;
}

function ManagerLadyTabInner({
  ylList,
  setYlList,
  names,
  selectedYLArea,
  setSelectedYLArea,
  ylDetail,
  dashboardData,
  formatRp,
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
  ylSavedMsg,
}: ManagerLadyTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. SECTION: DETAIL DATA PERFORMANCE YL */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
            Pilih Yakult Lady
          </label>
          <select
            value={selectedYLArea}
            onChange={(e) => setSelectedYLArea(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-700"
          >
            {(ylList && ylList.length > 0 ? ylList : names.map((n) => ({ area: n.substring(0, 3), nama: n }))).map((yl: any) => (
              <option key={yl.area} value={yl.area}>
                {yl.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Selected YL Details */}
        {ylDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase block">Total Akumulasi</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {Math.trunc(dashboardData?.perYL?.[selectedYLArea]?.akumulasi || 0).toLocaleString("id-ID")} btl
                </span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase block">Rata-Rata</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {Math.trunc(dashboardData?.perYL?.[selectedYLArea]?.rata2 || 0)} btl/hr
                </span>
              </div>
            </div>

            {/* Kompensasi */}
            {ylDetail.kompensasi && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-3 bg-emerald-950 text-white font-black text-[10px] uppercase tracking-wider">
                  Estimasi Rincian Kompensasi Bulanan
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody className="divide-y divide-slate-100 font-bold">
                      <tr>
                        <td className="p-2.5 text-slate-500 font-normal">Kompensasi Kotor</td>
                        <td className="p-2.5 text-right text-slate-800">{formatRp(ylDetail.kompensasi.kompensasi)}</td>
                      </tr>
                      <tr className="text-rose-600">
                        <td className="p-2.5 font-normal">Pph (5%/2)</td>
                        <td className="p-2.5 text-right">- {formatRp(ylDetail.kompensasi.pph)}</td>
                      </tr>
                      <tr className="text-rose-600">
                        <td className="p-2.5 font-normal">Iuran JKK / JKM</td>
                        <td className="p-2.5 text-right">- {formatRp(ylDetail.kompensasi.jkk)}</td>
                      </tr>
                      <tr className="text-rose-600">
                        <td className="p-2.5 font-normal">Iuran JHT</td>
                        <td className="p-2.5 text-right">- {formatRp(ylDetail.kompensasi.jht)}</td>
                      </tr>
                      <tr className="text-rose-600">
                        <td className="p-2.5 font-normal">Kresek / Potongan Mandiri</td>
                        <td className="p-2.5 text-right">- {formatRp(ylDetail.kompensasi.kresekDll)}</td>
                      </tr>
                      <tr className="bg-emerald-50 text-emerald-800 font-extrabold text-sm border-t border-emerald-200">
                        <td className="p-2.5">Kompensasi Bersih</td>
                        <td className="p-2.5 text-right">{formatRp(ylDetail.kompensasi.kompenBersih)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Pilih nama untuk melihat breakdown sektor dan target...</p>
        )}

        {/* Performance Tim Summary Table */}
        {dashboardData && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-3 bg-red-950 text-white font-black text-[10px] uppercase tracking-wider">
              Kinerja Akumulatif & Rata-Rata YL
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="p-2.5">Nama YL</th>
                    <th className="p-2.5 text-right">Akm</th>
                    <th className="p-2.5 text-right">Rata2/hr</th>
                    <th className="p-2.5 text-right">vs Tgt</th>
                    <th className="p-2.5 text-right">vs Bln Lalu</th>
                    <th className="p-2.5 text-right">vs Thn Lalu</th>
                    <th className="p-2.5 text-right">BB %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {Object.values(dashboardData?.perYL || {}).map((y: any) => {
                    const vsTgt = y.targetYL > 0 ? Math.trunc((y.rata2 / y.targetYL) * 100) : 0;
                    const vsBln = y.bulanLaluYL > 0 ? Math.trunc((y.rata2 / y.bulanLaluYL) * 100) : 0;
                    const vsThn = y.tahunLaluYL > 0 ? Math.trunc((y.rata2 / y.tahunLaluYL) * 100) : 0;
                    const bbPct = (y.akumulasi + y.bbYL) > 0 ? Math.trunc((y.bbYL / (y.akumulasi + y.bbYL)) * 100) : 0;
                    return (
                      <tr key={y.nama} className="hover:bg-slate-50 text-slate-800">
                        <td className="p-2.5 truncate font-extrabold max-w-[100px]">{y.nama}</td>
                        <td className="p-2.5 text-right text-emerald-600">{y.akumulasi}</td>
                        <td className="p-2.5 text-right text-slate-900">{Math.trunc(y.rata2)}</td>
                        <td className="p-2.5 text-right text-blue-600">{vsTgt}%</td>
                        <td className="p-2.5 text-right text-purple-600">{vsBln}%</td>
                        <td className="p-2.5 text-right text-teal-600">{vsThn}%</td>
                        <td className="p-2.5 text-right text-rose-600">{bbPct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. SECTION: KELOLA PROFIL & STATUS YL */}
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
