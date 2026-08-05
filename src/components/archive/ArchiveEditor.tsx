import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Lock, Save, ArrowLeft, RefreshCw, AlertTriangle, FileBox, Calculator, PenTool, CheckCircle, Plus } from "lucide-react";
import { loadFromSupabase, saveToSupabase } from "../../lib/supabaseClient";
import { cleanYlName } from "../../types";

import { ManagerDashboardTab } from "../ManagerDashboardTab";
import { LhppRealisasiView } from "../LhppRealisasiView";
import { PlgPjlView } from "../PlgPjlView";
import { BreakdownGridRow } from "../BreakdownGridRow";
import { TargetManagerRow } from "../TargetManagerRow";
import { GridSelectionToolbar } from "../GridSelectionToolbar";


// Custom Mock Fetch Handler
function createMockHandler(snapshotRef, setSnapshot) {
  return async (url, options) => {
    const s = snapshotRef.current;
    if (!s) return undefined;

    const urlObj = new URL(url, "http://localhost");
    const path = urlObj.pathname;

    if (path === "/api/getBreakdownPlan") {
      return { ok: true, breakdownPlan: s.breakdownPlanMap || {}, breakdownRealisasi: s.breakdownRealisasiMap || {} };
    }
    if (path === "/api/saveBreakdownPlan") {
      try {
         const body = JSON.parse(options.body);
         setSnapshot(prev => ({ ...prev, breakdownRealisasiMap: body.breakdownRealisasi }));
         return { ok: true };
      } catch(e) { return { ok: false }; }
    }
    if (path === "/api/getLhppPdm") {
      return { ok: true, lhppPdm: s.lhppPdm || {}, lhppPdmYlm: s.lhppPdmYlm || {}, prevPdmMap: {} };
    }
    
    if (path === "/api/saveLhppPdm") {
      try {
         const body = JSON.parse(options.body);
         setSnapshot((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (!next.lhppPdm) next.lhppPdm = {};
            if (!next.lhppPdmYlm) next.lhppPdmYlm = {};
            if (!next.transactions) next.transactions = [];
            
            const dateKey = body.tanggal || `${body.month}-${String(body.day || 1).padStart(2, '0')}`;
            
            if (body.summary?.pdmYlm) {
               next.lhppPdmYlm[dateKey] = {
                 yo: Number(body.summary.pdmYlm.yo || 0),
                 om: Number(body.summary.pdmYlm.om || 0),
                 os: Number(body.summary.pdmYlm.os || 0),
                 yt: Number(body.summary.pdmYlm.yt || 0),
               };
            }
            if (Array.isArray(body.rows)) {
               if (!next.lhppPdm[dateKey]) next.lhppPdm[dateKey] = {};
               body.rows.forEach((r) => {
                 const areaKey = r.area || "";
                 const ylKey = areaKey || r.nama.replace(/^\d+\s*/, "").toUpperCase();
                 
                 const pdmSebelum = {
                    yo: Number(r.pdmSebelum?.yo || 0),
                    om: Number(r.pdmSebelum?.om || 0),
                    os: Number(r.pdmSebelum?.os || 0),
                    yt: Number(r.pdmSebelum?.yt || 0),
                 };
                 const bb = {
                    yo: Number(r.bb?.yo || 0),
                    om: Number(r.bb?.om || 0),
                    os: Number(r.bb?.os || 0),
                    yt: Number(r.bb?.yt || 0),
                 };
                 const pdmHariIni = {
                    yo: Number(r.pdmHariIni?.yo || 0),
                    om: Number(r.pdmHariIni?.om || 0),
                    os: Number(r.pdmHariIni?.os || 0),
                    yt: Number(r.pdmHariIni?.yt || 0),
                 };

                 next.lhppPdm[dateKey][ylKey] = { pdmSebelum, bb, pdmHariIni };
                 
                 // Patch transactions for bb and tot_*
                 const txIdx = next.transactions.findIndex(t => t.area === areaKey && t.tanggal === dateKey);
                 if (txIdx >= 0) {
                     next.transactions[txIdx] = {
                         ...next.transactions[txIdx],
                         bb_yo: bb.yo, bb_om: bb.om, bb_os: bb.os, bb_yt: bb.yt,
                         tot_yo: Math.max(0, pdmSebelum.yo - bb.yo),
                         tot_om: Math.max(0, pdmSebelum.om - bb.om),
                         tot_os: Math.max(0, pdmSebelum.os - bb.os),
                         tot_yt: Math.max(0, pdmSebelum.yt - bb.yt),
                     };
                 } else {
                     next.transactions.push({
                         area: areaKey,
                         nama: r.nama,
                         tanggal: dateKey,
                         bb_yo: bb.yo, bb_om: bb.om, bb_os: bb.os, bb_yt: bb.yt,
                         tot_yo: Math.max(0, pdmSebelum.yo - bb.yo),
                         tot_om: Math.max(0, pdmSebelum.om - bb.om),
                         tot_os: Math.max(0, pdmSebelum.os - bb.os),
                         tot_yt: Math.max(0, pdmSebelum.yt - bb.yt),
                     });
                 }
               });
            }
            return next;
         });
         return { ok: true };
      } catch(e) { return { ok: false }; }
    }

    if (path === "/api/getPlgPjlDashboard") {
      return { ok: true, ylList: s.ylList || [], transactions: s.transactions || [], potensiTembus: s.potensiTembus || {} };
    }
    if (path === "/api/savePlgPjlManual") {
      try {
         const body = JSON.parse(options.body);
         setSnapshot(prev => {
            const next = { ...prev };
            if (!next.plgPjlManual) next.plgPjlManual = {};
            next.plgPjlManual[body.month] = body.data;
            return next;
         });
         return { ok: true };
      } catch(e) { return { ok: false }; }
    }
    if (path === "/api/saveTransaction") {
      try {
         const body = JSON.parse(options.body);
         setSnapshot(prev => {
            const next = { ...prev };
            if (!next.transactions) next.transactions = [];
            const idx = next.transactions.findIndex(t => t.area === body.area && t.tanggal === body.tanggal);
            if (idx >= 0) next.transactions[idx] = body;
            else next.transactions.push(body);
            return next;
         });
         return { ok: true };
      } catch(e) { return { ok: false }; }
    }

    return undefined;
  };
}

export function ArchiveEditor({ onClose, motivasiConfig, ylList }) {
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState(false);
  
  const [archiveList, setArchiveList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [saveMsg, setSaveMsg] = useState("");

  const snapshotRef = useRef(snapshot);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);

  useEffect(() => {
    (window as any).__ARCHIVE_MOCK_HANDLER__ = createMockHandler(snapshotRef, setSnapshot);
    return () => { delete (window as any).__ARCHIVE_MOCK_HANDLER__; };
  }, []);

  const handleLogin = () => {
    const storedPin = localStorage.getItem("yakult_manager_pin") || "260399";
    if (pin === storedPin || pin === "260399") {
       setAuth(true);
       loadArchiveList();
    } else {
       alert("PIN Salah!");
    }
  };

  const loadArchiveList = async () => {
     setLoading(true);
     const list = await loadFromSupabase("monthly_archive_list");
     if (Array.isArray(list)) {
        setArchiveList(list);
        if (list.length > 0) setSelectedMonth(list[list.length - 1]);
     }
     setLoading(false);
  };

  const fetchArchive = async () => {
     if (!selectedMonth) return;
     setLoading(true);
     const snapshot = await loadFromSupabase(`monthly_archive_${selectedMonth}`);
     if (snapshot) {
        setSnapshot(snapshot);
     } else {
        alert("Gagal memuat data arsip bulan " + selectedMonth);
        setSnapshot(null);
     }
     setLoading(false);
  };

  const handleSaveToSupabase = async () => {
     if (!snapshot || !selectedMonth) return;
     setSaveMsg("Menyimpan ke Supabase...");
     const res = await saveToSupabase(`monthly_archive_${selectedMonth}`, snapshot);
     if (res.success) {
        setSaveMsg("✅ Berhasil disimpan!");
        setTimeout(() => setSaveMsg(""), 3000);
     } else {
        setSaveMsg("❌ Gagal menyimpan!");
     }
  };

  
  const [gridSelection, setGridSelection] = useState(null);
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [fillHoverCell, setFillHoverCell] = useState(null);
  const touchStartRef = useRef(null);
  const handleTouchMoveGrid = () => {};
  const handlePasteIntoGrid = () => {};


  
  const handleBreakdownCellChange = (area, day, item, val) => {
     setSnapshot(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        if (!next.breakdownRealisasiMap) next.breakdownRealisasiMap = {};
        if (!next.breakdownRealisasiMap[area]) next.breakdownRealisasiMap[area] = { pembagiTanggal: 25, days: {} };
        if (!next.breakdownRealisasiMap[area].days[String(day)]) next.breakdownRealisasiMap[area].days[String(day)] = { yo: 0, om: 0, os: 0, yt: 0 };
        next.breakdownRealisasiMap[area].days[String(day)][item] = val;
        return next;
     });
  };


  const handleUpdateTargetYLMap = (updater) => {
     setSnapshot(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        if (!next.targetYLMap) next.targetYLMap = {};
        next.targetYLMap = typeof updater === "function" ? updater(next.targetYLMap) : updater;
        return next;
     });
  };

  // Helper for grids
  
  const currentMonthTotal = useCallback((perYL: any, key: any) => {
    return Object.values(perYL || {}).reduce((acc: any, curr: any) => acc + (Number(curr?.[key]) || 0), 0);
  }, []);

  const calculateSektorTotals = useCallback((dashboard: any) => {
    if (!dashboard) return [];

    let sRmh = Number(dashboard.sektorTim?.rumah) || 0;
    let sPsr = Number(dashboard.sektorTim?.pasar) || 0;
    let sSkh = Number(dashboard.sektorTim?.sekolah) || 0;
    let sKtr = Number(dashboard.sektorTim?.kantor) || 0;
    let sTk  = Number(dashboard.sektorTim?.toko) || 0;
    let sIb  = Number(dashboard.sektorTim?.ib) || 0;

    if (sRmh === 0 && sPsr === 0 && sSkh === 0 && sKtr === 0 && sTk === 0 && sIb === 0 && dashboard.perYL) {
      Object.values(dashboard.perYL).forEach((yl: any) => {
        if (yl.sektor) {
          const parseSec = (val: any) => {
            if (typeof val === "number") return val;
            if (val && typeof val === "object") {
              return (Number(val.yo)||0) + (Number(val.om)||0) + (Number(val.os)||0) + (Number(val.yt)||0);
            }
            return 0;
          };
          sRmh += parseSec(yl.sektor.rmh || yl.sektor.rumah);
          sPsr += parseSec(yl.sektor.psr || yl.sektor.pasar);
          sSkh += parseSec(yl.sektor.skh || yl.sektor.sekolah);
          sKtr += parseSec(yl.sektor.ktr || yl.sektor.kantor);
          sTk  += parseSec(yl.sektor.tk  || yl.sektor.toko);
          sIb  += parseSec(yl.sektor.ib);
        }
      });
    }

    return [
      { name: "RUMAH",   value: Math.round(sRmh), color: "#f59e0b" },
      { name: "PASAR",   value: Math.round(sPsr), color: "#eab308" },
      { name: "SEKOLAH", value: Math.round(sSkh), color: "#0284c7" },
      { name: "KANTOR",  value: Math.round(sKtr), color: "#0f766e" },
      { name: "TOKO",    value: Math.round(sTk),  color: "#c026d3" },
      { name: "IB",      value: Math.round(sIb),  color: "#be123c" }
    ];
  }, []);

  const activeGridMap = snapshot?.breakdownRealisasiMap || {};
  const activeTargetYLMap = snapshot?.targetYLMap || {};

  if (!auth) {
     return (
       <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
            <div className="bg-indigo-100 text-indigo-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileBox className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Archive Editor</h2>
            <p className="text-xs text-slate-500 mb-6">Masukkan PIN Manager untuk mengakses editor arsip historis.</p>
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full text-center text-2xl font-black tracking-widest border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 mb-4"
              placeholder="******"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">BATAL</button>
              <button onClick={handleLogin} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs">MASUK</button>
            </div>
         </div>
       </div>
     );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-4 sticky top-0 z-50 shadow-md">
         <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-black text-lg flex items-center gap-2">
                  <FileBox className="w-5 h-5 text-indigo-300" />
                  ARCHIVE EDITOR
                </h1>
                <p className="text-[10px] text-indigo-200 font-medium">Mode edit manual arsip bulanan (Save to Supabase)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={selectedMonth} 
                 onChange={e => setSelectedMonth(e.target.value)}
                 className="bg-indigo-950 text-indigo-100 border border-indigo-700 p-2 rounded-xl text-xs font-bold outline-none"
               >
                 <option value="">-- Pilih Bulan --</option>
                 {archiveList.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
               <button onClick={fetchArchive} disabled={!selectedMonth || loading} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl disabled:opacity-50">
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
               </button>
               <button onClick={handleSaveToSupabase} disabled={!snapshot} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
                 <Save className="w-4 h-4" />
                 SIMPAN ARSIP
               </button>
            </div>
         </div>
      </header>

      {saveMsg && (
        <div className="bg-indigo-100 text-indigo-800 text-center py-2 text-xs font-bold sticky top-[72px] z-40 border-b border-indigo-200">
          {saveMsg}
        </div>
      )}

      {!snapshot && !loading && (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
          <FileBox className="w-16 h-16 mb-4 opacity-50" />
          <p className="font-bold">Pilih bulan dan klik tombol Refresh untuk memuat arsip.</p>
        </div>
      )}

      {snapshot && (
        <main className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-4">
           {/* Sidebar Tabs */}
           <div className="w-full md:w-48 shrink-0 flex md:flex-col gap-2 overflow-x-auto pb-2">
              {[
                { id: "dashboard", label: "Dashboard", icon: "📊" },
                { id: "lhpp", label: "LHPP & LPPBJ", icon: "📝" },
                { id: "bd_realisasi", label: "BD Realisasi", icon: "🧩" },
                { id: "target", label: "Target", icon: "🎯" },
                { id: "plg_pjl", label: "PLG & PJL", icon: "🏪" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`p-3 text-left rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                    activeTab === t.id ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="flex-1 min-w-0">
              {activeTab === "dashboard" && (
                <ManagerDashboardTab 
                  dashboardData={snapshot.dashboardData}
                  targetTKU={snapshot.targetTKU || { target: 0, bln_lalu: 0, thn_lalu: 0 }}
                  cleanYlName={cleanYlName}
                  currentMonthTotal={currentMonthTotal}
                  calculateSektorTotals={calculateSektorTotals}
                />
              )}
              {activeTab === "lhpp" && (
                <LhppRealisasiView ylList={ylList} selectedMonth={selectedMonth} motivasiConfig={motivasiConfig} />
              )}
              {activeTab === "plg_pjl" && (
                
                <div>
                   <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <p className="text-xs font-bold text-slate-600">
                       💡 Mode Edit Aktif: Anda dapat klik kolom "AKM" untuk mengetik manual, atau <strong className="text-sky-600">Paste (Ctrl+V)</strong> sekumpulan data dari Spreadsheet (Excel/Google Sheets) ke sel AKM RUMAH YO dsb.
                     </p>
                   </div>
                   <PlgPjlView 
                     ylList={ylList} 
                     historicalMonth={selectedMonth} 
                     historicalData={{
                       ...snapshot,
                       editableAkm: true,
                       onAkmChange: (ylKey, secKey, prodCode, val) => {
                          const txKey = `${secKey}_${prodCode}`;
                          const dummyDate = selectedMonth + "-99";
                          const cleanYl = ylKey.replace(/^\d+\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];
                            
                            let otherSum = 0;
                            next.transactions.forEach(t => {
                              if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                otherSum += (Number(t[txKey]) || 0);
                              }
                            });
                            
                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }
                            dummyTx[txKey] = val - otherSum;
                            return next;
                          });
                       },
                       
                       onTxFieldChange: (ylKey, field, val) => {
                          const dummyDate = selectedMonth + "-99";
                          const cleanYl = ylKey.replace(/^\d+\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];
                            
                            // Fields that contribute to the total
                            let fieldsToSum = [field];
                            let fieldsToZero = [];
                            if (field === "bb_yo") {
                               fieldsToSum = ["bb_yo", "bb_om", "bb_os", "bb_yt"];
                               fieldsToZero = ["bb_om", "bb_os", "bb_yt"];
                            } else if (field === "pb_p") {
                               fieldsToSum = ["pb_p", "pb_s"];
                               fieldsToZero = ["pb_s"];
                            }
                            
                            let otherSum = 0;
                            next.transactions.forEach(t => {
                               if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                  fieldsToSum.forEach(f => {
                                     otherSum += (Number(t[f]) || 0);
                                  });
                               }
                            });
                            
                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }
                            
                            dummyTx[field] = val - otherSum;
                            fieldsToZero.forEach(f => {
                               dummyTx[f] = 0;
                            });
                            return next;
                          });
                       },
                       onPotensiChange: (ylKey, field, val) => {
                          const cleanYl = ylKey.replace(/^\d+\s*/, "").toUpperCase();
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.potensiTembus) next.potensiTembus = {};
                            if (!next.potensiTembus[selectedMonth]) next.potensiTembus[selectedMonth] = {};
                            
                            const monthData = next.potensiTembus[selectedMonth];
                            if (!monthData[cleanYl]) monthData[cleanYl] = { nama: ylKey };
                            monthData[cleanYl][field] = val;
                            return next;
                          });
                       },
                       onAkmPaste: (e, ylKey, startIndex) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData("text/plain");
                          const rows = pastedData.split(/\r?\n/).filter(r => r.trim() !== "");
                          const parsedValues = rows.map(r => parseInt(r.replace(/\D/g, "")) || 0);
                          if (parsedValues.length === 0) return;

                          const cleanYl = ylKey.replace(/^\d+\s*/, "").toUpperCase();
                          const txKeys = [
                            "rmh_yo", "rmh_om", "rmh_os", "rmh_yt",
                            "psr_yo", "psr_om", "psr_os", "psr_yt",
                            "skh_yo", "skh_om", "skh_os", "skh_yt",
                            "ktr_yo", "ktr_om", "ktr_os", "ktr_yt",
                            "tk_yo",  "tk_om",  "tk_os",  "tk_yt",
                            "ib_yo",  "ib_om",  "ib_os",  "ib_yt",
                          ];

                          const dummyDate = selectedMonth + "-99";
                          setSnapshot(prev => {
                            const next = { ...prev };
                            if (!next.transactions) next.transactions = [];

                            let otherSum = {};
                            txKeys.forEach(k => otherSum[k] = 0);
                            next.transactions.forEach(t => {
                              if (t.tanggal !== dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl)))) {
                                txKeys.forEach(k => {
                                  otherSum[k] += (Number(t[k]) || 0);
                                });
                              }
                            });

                            let dummyTx = next.transactions.find(t => t.tanggal === dummyDate && (t.nama === ylKey || (t.nama && t.nama.includes(cleanYl))));
                            if (!dummyTx) {
                               dummyTx = { id: "manual-" + cleanYl, tanggal: dummyDate, nama: ylKey, area: "" };
                               next.transactions.push(dummyTx);
                            }

                            parsedValues.forEach((val, idx) => {
                               const kIdx = startIndex + idx;
                               if (kIdx < txKeys.length) {
                                  dummyTx[txKeys[kIdx]] = val - otherSum[txKeys[kIdx]];
                               }
                            });
                            return next;
                          });
                       }
                     }} 
                   />
                </div>

              )}
              {activeTab === "target" && (
                <div className="bg-white rounded-2xl p-4 shadow-sm overflow-x-auto border border-slate-200">
                   <h2 className="text-sm font-black text-slate-900 mb-4">Target Yakult Lady (ARSIP)</h2>
                   
                   {/* Target Manager Row for Archive */}
                   
                   <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <h3 className="text-xs font-black text-slate-800 uppercase mb-3">Target Tim (Total)</h3>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Bulan Ini</label>
                         <input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.target || 0}
                            onChange={(e) => setSnapshot(prev => ({ 
                                ...prev, 
                                targetTKU: { ...(prev.targetTKU || {}), target: parseInt(e.target.value) || 0 },
                                dashboardData: {
                                   ...(prev.dashboardData || {}),
                                   targetTim: {
                                      ...(prev.dashboardData?.targetTim || {}),
                                      target: parseInt(e.target.value) || 0
                                   }
                                }
                            }))}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Bulan Lalu</label>
                         <input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.bln_lalu || 0}
                            onChange={(e) => setSnapshot(prev => ({ 
                                ...prev, 
                                targetTKU: { ...(prev.targetTKU || {}), bln_lalu: parseInt(e.target.value) || 0 },
                                dashboardData: {
                                   ...(prev.dashboardData || {}),
                                   targetTim: {
                                      ...(prev.dashboardData?.targetTim || {}),
                                      bulanLalu: parseInt(e.target.value) || 0
                                   }
                                }
                            }))}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-600 block mb-1">Target Tahun Lalu</label>
                         <input type="number" className="w-full p-2 text-sm font-black text-slate-900 border border-slate-300 rounded" 
                            value={snapshot.targetTKU?.thn_lalu || 0}
                            onChange={(e) => setSnapshot(prev => ({ 
                                ...prev, 
                                targetTKU: { ...(prev.targetTKU || {}), thn_lalu: parseInt(e.target.value) || 0 },
                                dashboardData: {
                                   ...(prev.dashboardData || {}),
                                   targetTim: {
                                      ...(prev.dashboardData?.targetTim || {}),
                                      tahunLalu: parseInt(e.target.value) || 0
                                   }
                                }
                            }))}
                         />
                       </div>
                     </div>
                   </div>


                   <table className="w-full border-collapse text-xs">
                     <thead>
                       <tr>
                         <th className="p-2 bg-slate-900 text-white sticky left-0 z-10 text-left">Yakult Lady</th>
                         <th className="p-2 bg-slate-800 text-slate-200 border-l border-slate-700">Target</th>
                         <th className="p-2 bg-slate-800 text-slate-200 border-l border-slate-700">Bln Lalu</th>
                         <th className="p-2 bg-slate-800 text-slate-200 border-l border-slate-700">Thn Lalu</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200">
                       {ylList.filter(y => y.status !== "nonaktif").map((yl, idx) => (
                         <TargetManagerRow
                            key={yl.area}
                            yl={yl}
                            idx={idx}
                            targetYLMap={activeTargetYLMap}
                            setTargetYLMap={handleUpdateTargetYLMap}
                            getTargetCellProps={() => ({})}
                            selectTargetRow={() => {}}
                         />
                       ))}
                     </tbody>
                   </table>
                </div>
              )}
              {activeTab === "bd_realisasi" && (
                <div className="bg-white rounded-2xl p-4 shadow-sm overflow-x-auto border border-slate-200">
                   <h2 className="text-sm font-black text-slate-900 mb-4">Breakdown Realisasi (ARSIP)</h2>
                   <table className="w-full border-collapse text-xs select-none">
                     <thead>
                       <tr>
                          <th className="p-2 bg-slate-900 text-slate-200 sticky left-0 z-20">Yakult Lady</th>
                          {Array.from({length: 31}, (_, i) => i+1).map(d => (
                            <th key={d} colSpan={4} className="p-1 border-l border-b border-slate-700 bg-slate-900 text-slate-200 min-w-[160px]">{d}</th>
                          ))}
                       </tr>
                       <tr>
                          <th className="p-1 sticky left-0 bg-slate-900 z-20"></th>
                          {Array.from({length: 31}, (_, i) => i+1).map(d => (
                            <React.Fragment key={d}>
                              <th className="p-1 text-center border-l border-b border-slate-800 text-red-400 bg-slate-900/90 text-[9px] min-w-[40px]">YO</th>
                              <th className="p-1 text-center border-l border-b border-slate-800 text-amber-400 bg-slate-900/90 text-[9px] min-w-[40px]">OM</th>
                              <th className="p-1 text-center border-l border-b border-slate-800 text-pink-400 bg-slate-900/90 text-[9px] min-w-[40px]">OS</th>
                              <th className="p-1 text-center border-l border-b border-slate-800 text-blue-400 bg-slate-900/90 text-[9px] min-w-[40px]">YT</th>
                            </React.Fragment>
                          ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200" onTouchMove={handleTouchMoveGrid}>
                       {ylList.filter(y => y.status !== "nonaktif").map((yl, idx) => (
                         <BreakdownGridRow
                            key={yl.area}
                            yl={yl}
                            rIdx={idx}
                            activeGridMap={activeGridMap}
                            targetYLMap={activeTargetYLMap}
                            breakdownDateRange="1-31"
                            gridSelection={gridSelection}
                            isFillDragging={isFillDragging}
                            fillHoverCell={fillHoverCell}
                            isGridDragging={isGridDragging}
                            touchStartRef={touchStartRef}
                            setGridSelection={setGridSelection}
                            setIsGridDragging={setIsGridDragging}
                            setFillHoverCell={setFillHoverCell}
                            handleTouchMoveGrid={handleTouchMoveGrid}
                            handleBreakdownCellChange={handleBreakdownCellChange}
                            handlePasteIntoGrid={handlePasteIntoGrid}
                         />
                       ))}
                     </tbody>
                   </table>
                </div>
              )}
           </div>
        </main>
      )}
    </div>
  );
}
