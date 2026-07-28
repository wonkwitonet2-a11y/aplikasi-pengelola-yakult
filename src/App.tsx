import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { KeyRound, Lock, } from "lucide-react";
import { Transaction, MotivasiConfig, KontesRow, DashboardData, EvaluasiData } from "./types";
import { safeFetchJson, parseJsonResponse } from "./lib/safeFetch";
import {
  getStoredManagerPin,
  getStoredYlPins,
  getStoredYlList,
  saveStoredYlData
} from "./lib/storage";

// Lazy-loaded: masing-masing hanya di-download & di-parse browser saat memang
// akan dirender (setelah login berhasil dan role diketahui). Sebelumnya semua
// diimpor langsung (eager) di atas, jadi seorang YL ikut mendownload seluruh
// kode ManagerView (3900+ baris + library chart recharts) padahal tidak
// pernah dipakainya — salah satu penyebab app berat di HP entry-level.
const ManagerView = lazy(() =>
  import("./components/ManagerView").then(m => ({ default: m.ManagerView }))
);
const YLView = lazy(() =>
  import("./components/YLView").then(m => ({ default: m.YLView }))
);
const AIChatBot = lazy(() => import("./components/AIChatBot"));

// Fallback ringan selagi chunk sedang di-download (biasanya sekejap di HP
// dgn koneksi normal, tapi tetap perlu ada agar tidak blank/error).
function ViewLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
      Memuat...
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<{ role: "manager" | "yl"; name: string } | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Theme support (light/dark)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return (saved === "dark" || saved === "light") ? saved : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  // Global Datasets
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [evaluasiData, setEvaluasiData] = useState<EvaluasiData | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [motivasiConfig, setMotivasiConfig] = useState<MotivasiConfig>(() => {
    try {
      const saved = localStorage.getItem("yakult_motivasi_config");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      list: [],
      terpilih: [],
      intervalDetik: 30,
      enabled: true,
      chatbotName: "AI Jember 1 Pro",
      tkuName: "DP Jember 1"
    };
  });
  const [kontesConfig, setKontesConfig] = useState<{ enabled: boolean; rows: KontesRow[] }>({
    enabled: true,
    rows: []
  });

  // Simulator fallbacks (for local copy)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targetYL, setTargetYL] = useState<any[]>([]);
  const [breakdownRealisasi, setBreakdownRealisasi] = useState<any[]>([]);
  const [tanggalValid, setTanggalValid] = useState<string[]>([]);

  // System PIN dictionary (fetched from server or LocalStorage)
  const [activeManagerPin, setActiveManagerPin] = useState<string>(() => getStoredManagerPin());
  const [activeYlPins, setActiveYlPins] = useState<Record<string, string>>(() => getStoredYlPins());

  // 1. Initial Load & Session Recovery
  useEffect(() => {
    const saved = localStorage.getItem("yakult_session");
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("yakult_session");
      }
    }

    // Load PIN dictionary and script url from backend
    const safeFetchJson = async (url: string) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      } catch (e) {
        console.warn(`Fetch failed for ${url}`, e);
        return null;
      }
    };

    Promise.all([
      safeFetchJson("/api/getPins"),
      safeFetchJson("/api/getScriptUrl"),
      safeFetchJson("/api/getMotivasi"),
      safeFetchJson("/api/getYlList")
    ])
      .then(([pins, scr, mot, ylData]) => {
        const mgrPin = pins?.managerPin || getStoredManagerPin();
        const ylPinsMap = (pins?.ylPins && Object.keys(pins.ylPins).length > 0)
          ? pins.ylPins
          : getStoredYlPins();

        setActiveManagerPin(mgrPin);
        setActiveYlPins(ylPinsMap);

        if (ylData && Array.isArray(ylData.ylList) && ylData.ylList.length > 0) {
          saveStoredYlData(ylData.ylList, mgrPin);
        } else {
          saveStoredYlData(getStoredYlList(), mgrPin);
        }

        if (scr && scr.scriptUrl) setScriptUrl(scr.scriptUrl);
        if (mot) {
          setMotivasiConfig(prev => {
            const updated = {
              ...prev,
              ...mot,
              chatbotName: prev.chatbotName || mot.chatbotName || "AI Jember 1 Pro",
              tkuName: prev.tkuName || mot.tkuName || "DP Jember 1"
            };
            try {
              localStorage.setItem("yakult_motivasi_config", JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      })
      .catch(e => {
        console.error("Error loading configs:", e);
        setActiveManagerPin(getStoredManagerPin());
        setActiveYlPins(getStoredYlPins());
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch Datasets when session is active
  useEffect(() => {
    if (!session) return;
    refreshAllData();

    // Periodic auto-sync so name/setting changes propagate to all accounts/tabs.
    // Interval is longer than before (20s instead of 8s) and pauses entirely
    // while the app is in the background/screen off, since polling every 8s
    // on 6 endpoints was a major source of lag and battery/data drain on
    // low-end phones.
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        refreshAllData(true);
      }, 20000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Refresh immediately on return, then resume the interval
        refreshAllData(true);
        startPolling();
      }
    };

    if (!document.hidden) startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, scriptUrl]);

  // Menyimpan JSON string hasil fetch terakhir per endpoint. Dipakai supaya
  // polling tiap 20 detik tidak memicu setState (dan render ulang ManagerView/
  // YLView yang berat) kalau ternyata datanya sama persis dengan sebelumnya —
  // ini kasus yang paling sering terjadi (tidak ada admin/YL lain yang baru
  // saja menyimpan sesuatu di 20 detik terakhir).
  const lastPayloadRef = useRef<Record<string, string>>({});

  const setIfChanged = <T,>(key: string, data: T, setter: (value: T) => void) => {
    const serialized = JSON.stringify(data);
    if (lastPayloadRef.current[key] === serialized) return false;
    lastPayloadRef.current[key] = serialized;
    setter(data);
    return true;
  };

  const refreshAllData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    const safeFetchJson = async (url: string) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      } catch (e) {
        console.warn(`Fetch failed for ${url}`, e);
        return null;
      }
    };

    try {
      const [db, ev, mot, knt, pins, ylListData] = await Promise.all([
        safeFetchJson("/api/getDashboardDP1"),
        safeFetchJson("/api/getEvaluasi"),
        safeFetchJson("/api/getMotivasi"),
        safeFetchJson("/api/getKontes"),
        safeFetchJson("/api/getPins"),
        safeFetchJson("/api/getYlList")
      ]);

      if (db) setIfChanged("dashboard", db, setDashboardData);
      const evData = ev && ev.evaluasiData ? ev.evaluasiData : ev;
      if (evData) setIfChanged("evaluasi", evData, setEvaluasiData);
      if (mot) {
        const motChanged = setIfChanged("motivasi", mot, () => {});
        if (motChanged) {
          setMotivasiConfig(prev => ({
            ...mot,
            chatbotName: mot.chatbotName || prev.chatbotName || "AI Jember 1 Pro",
            tkuName: mot.tkuName || prev.tkuName || "DP Jember 1"
          }));
        }
      }
      if (knt) setIfChanged("kontes", knt, setKontesConfig);
      if (pins && pins.managerPin) setIfChanged("managerPin", pins.managerPin, setActiveManagerPin);
      if (pins && pins.ylPins) setIfChanged("ylPins", pins.ylPins, setActiveYlPins);

      let activeName = session?.name || "";

      // Auto-update YL session name if YL was renamed in Setting/Profil YL
      if (session?.role === "yl" && session.name) {
        const area = session.name.substring(0, 3);
        const ylListArray = (ylListData && Array.isArray(ylListData.ylList)) ? ylListData.ylList : [];
        const matchedYl = ylListArray.find((y: any) => String(y.area).substring(0, 3) === area);
        const updatedYlName = matchedYl?.nama || (pins?.ylPins ? Object.values(pins.ylPins).find((n: any) => String(n).startsWith(area)) as string : null);
        
        if (updatedYlName && updatedYlName !== session.name) {
          activeName = updatedYlName;
          const updatedSession = { ...session, name: updatedYlName };
          setSession(updatedSession);
          localStorage.setItem("yakult_session", JSON.stringify(updatedSession));
        }
      }

      // Load specific YL records if role is YL
      if (session?.role === "yl" && activeName) {
        const mine = await safeFetchJson(`/api/getMine?nama=${encodeURIComponent(activeName)}`);
        if (mine) {
          if (mine.transactions) setIfChanged("myTransactions", mine.transactions, setTransactions);
          if (mine.targetYL) setIfChanged("myTargetYL", mine.targetYL, setTargetYL);
          setIfChanged("myBreakdownRealisasi", mine.breakdownRealisasi || [], setBreakdownRealisasi);
          setIfChanged("myTanggalValid", mine.tanggalValid || [], setTanggalValid);
        }
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // 3. Login Flow
  const handleLogin = async () => {
    setLoginError("");
    const pin = pinInput.trim();
    if (!pin) return;

    const mgrPin = activeManagerPin || getStoredManagerPin();
    const ylPinsMap = (activeYlPins && Object.keys(activeYlPins).length > 0)
      ? activeYlPins
      : getStoredYlPins();

    if (pin === mgrPin) {
      const newSession = { role: "manager" as const, name: "Manager DP Jember 1" };
      setSession(newSession);
      localStorage.setItem("yakult_session", JSON.stringify(newSession));
      setPinInput("");
    } else {
      // Find matching YL Pin
      const matchedYlName = ylPinsMap[pin];
      if (matchedYlName) {
        const newSession = { role: "yl" as const, name: matchedYlName };
        setSession(newSession);
        localStorage.setItem("yakult_session", JSON.stringify(newSession));
        setPinInput("");
      } else {
        setLoginError("PIN salah. Silakan coba kembali!");
        setPinInput("");
      }
    }
  };

  // 4. Logout Flow
  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("yakult_session");
    setTransactions([]);
    setTargetYL([]);
    setDashboardData(null);
    setEvaluasiData(null);
  };

  // 5. Save Report Transaction (YL view)
  const handleSaveTransaction = async (data: Transaction) => {
    try {
      const res = await fetch("/api/saveTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resJson = await parseJsonResponse(res);

      if (res.ok && resJson && resJson.ok) {
        await refreshAllData();
        return { ok: true };
      }
      return { ok: false, alreadyExists: resJson?.alreadyExists, error: resJson?.error || "Gagal menyimpan laporan." };
    } catch (e: any) {
      console.error(e);
      return { ok: false, error: e.message || "Terjadi kesalahan jaringan." };
    }
  };

  // 6. Save Target / Divisor config (YL view)
  const handleSaveTargetYL = async (data: any) => {
    try {
      const res = await fetch("/api/saveTargetYL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resJson = await parseJsonResponse(res);

      if (res.ok && resJson && resJson.ok) {
        await refreshAllData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // 7. Save Web App script url
  const handleSaveScriptUrl = async (url: string) => {
    try {
      await fetch("/api/saveScriptUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptUrl: url })
      });
      setScriptUrl(url);
      alert("Script URL berhasil diperbarui! Mencoba memuat ulang data...");
    } catch (e) {
      alert("Gagal memperbarui URL.");
    }
  };

  // 8. Save Motivasi Config (chatbotName & tkuName)
  const handleSaveMotivasiConfig = async (newConfig: MotivasiConfig) => {
    // 1. Instantly save locally
    setMotivasiConfig(newConfig);
    try {
      localStorage.setItem("yakult_motivasi_config", JSON.stringify(newConfig));
    } catch (e) {}

    // 2. Persist to server if available
    try {
      const res = await fetch("/api/saveMotivasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      const json = await parseJsonResponse(res);

      if (res.ok && json?.ok) {
        alert("Pengaturan nama berhasil disimpan!");
      } else {
        alert("Pengaturan nama berhasil disimpan secara lokal!");
      }
    } catch (e: any) {
      console.warn("Server sync error, saved locally:", e);
      alert("Pengaturan nama berhasil disimpan secara lokal!");
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 mt-3 uppercase tracking-wider">Memuat Sistem Jember 1...</p>
      </div>
    );
  }

  // LOGIN SCREEN RENDER
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-slate-950 to-slate-900 p-4 relative overflow-hidden">
        {/* Subtle decorative particles */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-rose-600/10 rounded-full blur-3xl" />

        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-red-900/10 relative z-10 transition-all">
          <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black px-4 py-1 text-2xl rounded-2xl shadow-lg inline-block animate-bounce mb-3">
            Y
          </span>
          <h1 className="text-lg font-black tracking-tight text-slate-800">
            YAKULT {(motivasiConfig?.tkuName || "JEMBER 1").toUpperCase()}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">
            {motivasiConfig?.tkuName || "DP Jember 1"} Sales System
          </p>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Masukkan PIN Anda"
                className="w-full pl-9 pr-3 py-3 border-2 border-slate-200 rounded-2xl text-center text-xl font-bold tracking-widest outline-none focus:border-red-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-600 font-bold text-center animate-shake">⚠️ {loginError}</p>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md active:scale-95"
            >
              Masuk ke Aplikasi
            </button>
          </div>

          <div className="mt-6 flex justify-center items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sandi & PIN dienkripsi server</span>
          </div>
        </div>
      </div>
    );
  }

  // MANAGER VIEW RENDER
  if (session.role === "manager") {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <ManagerView
          onLogout={handleLogout}
          dashboardData={dashboardData}
          evaluasiData={evaluasiData}
          onRefresh={refreshAllData}
          motivasiConfig={motivasiConfig}
          onUpdateMotivasi={handleSaveMotivasiConfig}
          kontesConfig={kontesConfig}
          scriptUrl={scriptUrl}
          onSaveScriptUrl={handleSaveScriptUrl}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <AIChatBot role={session.role} userName={session.name} botName={motivasiConfig?.chatbotName || "AI Jember 1 Pro"} />
      </Suspense>
    );
  }

  // YAKULT LADY VIEW RENDER
  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      <YLView
        ylName={session.name}
        onLogout={handleLogout}
        onRefresh={refreshAllData}
        transactions={transactions}
        targetYL={targetYL}
        breakdownRealisasi={breakdownRealisasi}
        tanggalValid={tanggalValid}
        onSaveTransaction={handleSaveTransaction}
        onSaveTargetYL={handleSaveTargetYL}
        motivasiConfig={motivasiConfig}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <AIChatBot role={session.role} userName={session.name} botName={motivasiConfig?.chatbotName || "AI Jember 1 Pro"} />
    </Suspense>
  );
}