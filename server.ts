import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "data.json");

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// DEFAULT KALIMAT MOTIVASI
const DEFAULT_MOTIVASI = [
  "Setiap botol yang terjual adalah langkah menuju target bulan ini!",
  "Senyum ke pelanggan hari ini, rezeki mengikuti besok.",
  "Yakult Lady hebat bukan yang paling cepat, tapi yang paling konsisten.",
  "Capaian kecil tiap hari, jadi kemenangan besar tiap bulan.",
  "Semangat pagi ini menentukan hasil sore nanti!",
  "Pelanggan setia lahir dari pelayanan yang tulus.",
  "Jangan bandingkan hari ini dengan kemarin, kalahkan diri sendiri.",
  "Rute boleh sama, tapi semangat harus selalu baru.",
  "Kerja keras hari ini, bonus manis akhir bulan.",
  "Satu sapaan ramah bisa membuka satu pelanggan baru."
];

const INITIAL_YL_LIST = [
  { area: "201", nama: "Gusrina", pin: "201", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "202", nama: "Dewi Ati Ani", pin: "202", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "203", nama: "Gusrini", pin: "203", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "204", nama: "Umi Maisaroh", pin: "204", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "205", nama: "Suyik Rahmawati", pin: "205", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "206", nama: "Ria Resti W", pin: "206", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "207", nama: "Endang Setiowati", pin: "207", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "208", nama: "Wakiah", pin: "208", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "209", nama: "Titis", pin: "209", status: "Aktif", tanggalDaftar: "2026-01-01" },
  { area: "210", nama: "Eni", pin: "210", status: "Aktif", tanggalDaftar: "2026-01-01" }
];

const DEFAULT_COMP_CONFIG = {
  tiers: [
    { threshold: 0, rate: 338 },
    { threshold: 200, rate: 374 },
    { threshold: 250, rate: 409 },
    { threshold: 280, rate: 417 },
    { threshold: 300, rate: 424 },
    { threshold: 330, rate: 428 },
    { threshold: 350, rate: 432 }
  ],
  pphRate: 2.5,
  jkkJkm: 18800,
  jht: 24000
};

const cleanYlName = (fullName: string): string => {
  if (!fullName) return "";
  let s = fullName.trim();
  s = s.replace(/^Area\s+\d+\s*[-_:]?\s*/i, "").trim();
  s = s.replace(/^\d+\s*[-_:]?\s*/, "").trim();
  s = s.replace(/^Area\s+[-_:]?\s*/i, "").trim();
  return s || fullName;
};


// INITIAL SEED DATA FOR SIMULATOR
const INITIAL_DATA = {
  scriptUrl: "",
  managerPin: "1111",
  ylList: INITIAL_YL_LIST,
  ylPins: INITIAL_YL_LIST.reduce((acc: any, curr) => {
    acc[curr.pin] = curr.nama;
    return acc;
  }, {}),
  compensationConfig: DEFAULT_COMP_CONFIG,
  motivasi: {
    list: [...DEFAULT_MOTIVASI],
    terpilih: [...DEFAULT_MOTIVASI],
    intervalDetik: 30,
    enabled: true,
    chatbotName: "AI Jember 1 Pro",
    tkuName: "DP Jember 1"
  },
  kontes: {
    enabled: false,
    rows: []
  },
  ca25: 0,
  bl38: 0,
  targetTKU: {
    target: 0, target_yo: 0, target_om: 0, target_os: 0, target_yt: 0,
    bln_lalu: 0, bln_lalu_yo: 0, bln_lalu_om: 0, bln_lalu_os: 0, bln_lalu_yt: 0,
    thn_lalu: 0, thn_lalu_yo: 0, thn_lalu_om: 0, thn_lalu_os: 0, thn_lalu_yt: 0
  },
  targetYL: INITIAL_YL_LIST.reduce((acc: any, curr) => {
    acc[`${curr.area}_2026-07`] = { target: 0, bln_lalu: 0, thn_lalu: 0, plg: 0, rk: 0, ra: 0, rb: 0, totalPb: 0, totalBb: 0, totalSampahBotol: 0 };
    return acc;
  }, {}),
  transactions: [] as any[]
};

// In-memory cache of data.json so repeated requests (dashboard polling etc.)
// don't re-read + re-parse the whole file from disk every single time.
// Writes are debounced instead of hitting the disk synchronously on every
// save, which was blocking the Node event loop and slowing every other
// request down. dashboardCacheDirty tracks whether the cached dashboard
// calculation below is stale.
let cachedDb: any = null;
let writeTimeout: ReturnType<typeof setTimeout> | null = null;
let dashboardDP1Cache: any = null;
let dashboardCacheDirty = true;

function safeWriteFile(filePath: string, content: string) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
  } catch (err: any) {
    console.warn("Disk write skipped (serverless/read-only filesystem):", err?.message || err);
  }
}

function flushPendingWrite() {
  if (writeTimeout) {
    clearTimeout(writeTimeout);
    writeTimeout = null;
  }
  if (cachedDb) {
    safeWriteFile(DATA_FILE, JSON.stringify(cachedDb, null, 2));
  }
}

// Make sure we don't lose the last unsaved change if the process exits.
process.on("exit", flushPendingWrite);
process.on("SIGINT", () => { flushPendingWrite(); process.exit(0); });
process.on("SIGTERM", () => { flushPendingWrite(); process.exit(0); });

function loadData() {
  if (cachedDb) return cachedDb;

  let db;
  if (!fs.existsSync(DATA_FILE)) {
    db = INITIAL_DATA;
    safeWriteFile(DATA_FILE, JSON.stringify(db, null, 2));
  } else {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      db = JSON.parse(raw);
    } catch (e) {
      db = INITIAL_DATA;
    }
  }

  // Ensure ylList, ylPins, and compensationConfig are always present
  if (!db.ylList || !Array.isArray(db.ylList)) {
    db.ylList = INITIAL_YL_LIST;
    db.ylPins = INITIAL_YL_LIST.reduce((acc: any, curr) => {
      acc[curr.pin] = curr.nama;
      return acc;
    }, {});
    safeWriteFile(DATA_FILE, JSON.stringify(db, null, 2));
  }
  if (!db.compensationConfig) {
    db.compensationConfig = DEFAULT_COMP_CONFIG;
    safeWriteFile(DATA_FILE, JSON.stringify(db, null, 2));
  }

  if (!db.transactions || !Array.isArray(db.transactions)) {
    db.transactions = [];
    safeWriteFile(DATA_FILE, JSON.stringify(db, null, 2));
  }

  if (!db.kontes || db.kontes.enabled !== false) {
    db.kontes = { enabled: false, rows: [] };
  }

  // Ensure breakdownPlan storage exists
  if (!db.breakdownPlan || typeof db.breakdownPlan !== "object") {
    db.breakdownPlan = {};
  }

  // Ensure breakdownRealisasi storage exists
  if (!db.breakdownRealisasi || typeof db.breakdownRealisasi !== "object") {
    db.breakdownRealisasi = {};
  }

  const sampleMonth = "2026-07";
  if (!db.breakdownRealisasi[sampleMonth] || Object.keys(db.breakdownRealisasi[sampleMonth]).length === 0) {
    db.breakdownRealisasi[sampleMonth] = {
      "201": { pembagiTanggal: 15, days: { "1": { yo: 475, om: 50, os: 50, yt: 25 }, "2": { yo: 625, om: 20, os: 95, yt: 0 }, "3": { yo: 500, om: 30, os: 60, yt: 10 }, "4": { yo: 550, om: 40, os: 70, yt: 20 }, "5": { yo: 480, om: 50, os: 50, yt: 20 }, "6": { yo: 520, om: 30, os: 80, yt: 10 }, "7": { yo: 600, om: 25, os: 65, yt: 10 }, "8": { yo: 510, om: 40, os: 70, yt: 30 }, "9": { yo: 530, om: 35, os: 75, yt: 10 }, "10": { yo: 580, om: 20, os: 80, yt: 20 }, "11": { yo: 490, om: 45, os: 55, yt: 10 }, "12": { yo: 540, om: 30, os: 70, yt: 20 }, "13": { yo: 560, om: 25, os: 65, yt: 10 }, "14": { yo: 500, om: 50, os: 50, yt: 20 }, "15": { yo: 570, om: 30, os: 80, yt: 20 } } },
      "202": { pembagiTanggal: 15, days: { "1": { yo: 420, om: 30, os: 40, yt: 10 }, "2": { yo: 480, om: 25, os: 55, yt: 15 }, "3": { yo: 450, om: 35, os: 45, yt: 20 }, "4": { yo: 500, om: 20, os: 60, yt: 10 }, "5": { yo: 430, om: 40, os: 50, yt: 10 }, "6": { yo: 470, om: 30, os: 50, yt: 20 }, "7": { yo: 510, om: 25, os: 55, yt: 10 }, "8": { yo: 460, om: 35, os: 45, yt: 15 }, "9": { yo: 490, om: 30, os: 60, yt: 10 }, "10": { yo: 520, om: 20, os: 65, yt: 15 }, "11": { yo: 440, om: 40, os: 50, yt: 10 }, "12": { yo: 480, om: 30, os: 55, yt: 15 }, "13": { yo: 500, om: 25, os: 60, yt: 10 }, "14": { yo: 450, om: 35, os: 45, yt: 20 }, "15": { yo: 510, om: 30, os: 60, yt: 10 } } },
      "203": { pembagiTanggal: 15, days: { "1": { yo: 450, om: 35, os: 45, yt: 15 }, "2": { yo: 500, om: 30, os: 60, yt: 10 }, "3": { yo: 470, om: 40, os: 50, yt: 20 }, "4": { yo: 520, om: 25, os: 65, yt: 10 }, "5": { yo: 460, om: 35, os: 55, yt: 15 }, "6": { yo: 490, om: 30, os: 60, yt: 10 }, "7": { yo: 530, om: 20, os: 70, yt: 20 }, "8": { yo: 480, om: 40, os: 50, yt: 10 }, "9": { yo: 510, om: 30, os: 65, yt: 15 }, "10": { yo: 540, om: 25, os: 70, yt: 10 }, "11": { yo: 470, om: 35, os: 55, yt: 15 }, "12": { yo: 500, om: 30, os: 60, yt: 20 }, "13": { yo: 520, om: 25, os: 65, yt: 10 }, "14": { yo: 480, om: 40, os: 50, yt: 15 }, "15": { yo: 530, om: 30, os: 70, yt: 10 } } },
      "204": { pembagiTanggal: 15, days: { "1": { yo: 410, om: 25, os: 35, yt: 10 }, "2": { yo: 460, om: 30, os: 45, yt: 15 }, "3": { yo: 430, om: 35, os: 40, yt: 10 }, "4": { yo: 480, om: 20, os: 50, yt: 10 }, "5": { yo: 420, om: 30, os: 45, yt: 15 }, "6": { yo: 450, om: 25, os: 50, yt: 10 }, "7": { yo: 490, om: 20, os: 55, yt: 15 }, "8": { yo: 440, om: 35, os: 40, yt: 10 }, "9": { yo: 470, om: 25, os: 50, yt: 15 }, "10": { yo: 500, om: 20, os: 55, yt: 10 }, "11": { yo: 430, om: 30, os: 45, yt: 10 }, "12": { yo: 460, om: 25, os: 50, yt: 15 }, "13": { yo: 480, om: 20, os: 55, yt: 10 }, "14": { yo: 440, om: 35, os: 40, yt: 15 }, "15": { yo: 490, om: 25, os: 50, yt: 10 } } },
      "205": { pembagiTanggal: 15, days: { "1": { yo: 460, om: 40, os: 50, yt: 15 }, "2": { yo: 510, om: 30, os: 65, yt: 20 }, "3": { yo: 480, om: 35, os: 55, yt: 10 }, "4": { yo: 530, om: 25, os: 70, yt: 15 }, "5": { yo: 470, om: 40, os: 60, yt: 10 }, "6": { yo: 500, om: 30, os: 65, yt: 20 }, "7": { yo: 540, om: 25, os: 75, yt: 10 }, "8": { yo: 490, om: 35, os: 60, yt: 15 }, "9": { yo: 520, om: 30, os: 70, yt: 10 }, "10": { yo: 550, om: 20, os: 75, yt: 20 }, "11": { yo: 480, om: 40, os: 55, yt: 10 }, "12": { yo: 510, om: 30, os: 65, yt: 15 }, "13": { yo: 530, om: 25, os: 70, yt: 10 }, "14": { yo: 490, om: 35, os: 60, yt: 15 }, "15": { yo: 540, om: 30, os: 75, yt: 10 } } },
      "206": { pembagiTanggal: 15, days: { "1": { yo: 430, om: 30, os: 40, yt: 10 }, "2": { yo: 470, om: 25, os: 50, yt: 15 }, "3": { yo: 440, om: 35, os: 45, yt: 10 }, "4": { yo: 490, om: 20, os: 55, yt: 15 }, "5": { yo: 430, om: 30, os: 45, yt: 10 }, "6": { yo: 460, om: 25, os: 50, yt: 15 }, "7": { yo: 500, om: 20, os: 60, yt: 10 }, "8": { yo: 450, om: 35, os: 45, yt: 10 }, "9": { yo: 480, om: 25, os: 55, yt: 15 }, "10": { yo: 510, om: 20, os: 60, yt: 10 }, "11": { yo: 440, om: 30, os: 45, yt: 15 }, "12": { yo: 470, om: 25, os: 50, yt: 10 }, "13": { yo: 490, om: 20, os: 55, yt: 15 }, "14": { yo: 450, om: 35, os: 45, yt: 10 }, "15": { yo: 500, om: 25, os: 55, yt: 15 } } },
      "207": { pembagiTanggal: 15, days: { "1": { yo: 400, om: 25, os: 35, yt: 10 }, "2": { yo: 450, om: 30, os: 45, yt: 10 }, "3": { yo: 420, om: 35, os: 40, yt: 15 }, "4": { yo: 470, om: 20, os: 50, yt: 10 }, "5": { yo: 410, om: 30, os: 40, yt: 10 }, "6": { yo: 440, om: 25, os: 45, yt: 15 }, "7": { yo: 480, om: 20, os: 50, yt: 10 }, "8": { yo: 430, om: 35, os: 40, yt: 10 }, "9": { yo: 460, om: 25, os: 45, yt: 15 }, "10": { yo: 490, om: 20, os: 50, yt: 10 }, "11": { yo: 420, om: 30, os: 40, yt: 10 }, "12": { yo: 450, om: 25, os: 45, yt: 15 }, "13": { yo: 470, om: 20, os: 50, yt: 10 }, "14": { yo: 430, om: 35, os: 40, yt: 15 }, "15": { yo: 480, om: 25, os: 45, yt: 10 } } },
      "208": { pembagiTanggal: 15, days: { "1": { yo: 440, om: 30, os: 45, yt: 15 }, "2": { yo: 490, om: 25, os: 55, yt: 10 }, "3": { yo: 460, om: 35, os: 50, yt: 15 }, "4": { yo: 510, om: 20, os: 60, yt: 10 }, "5": { yo: 450, om: 30, os: 50, yt: 15 }, "6": { yo: 480, om: 25, os: 55, yt: 10 }, "7": { yo: 520, om: 20, os: 65, yt: 15 }, "8": { yo: 470, om: 35, os: 50, yt: 10 }, "9": { yo: 500, om: 25, os: 60, yt: 15 }, "10": { yo: 530, om: 20, os: 65, yt: 10 }, "11": { yo: 460, om: 30, os: 50, yt: 15 }, "12": { yo: 490, om: 25, os: 55, yt: 10 }, "13": { yo: 510, om: 20, os: 60, yt: 15 }, "14": { yo: 470, om: 35, os: 50, yt: 10 }, "15": { yo: 520, om: 25, os: 60, yt: 15 } } },
      "209": { pembagiTanggal: 15, days: { "1": { yo: 420, om: 25, os: 40, yt: 10 }, "2": { yo: 460, om: 30, os: 45, yt: 15 }, "3": { yo: 430, om: 35, os: 40, yt: 10 }, "4": { yo: 480, om: 20, os: 50, yt: 15 }, "5": { yo: 420, om: 30, os: 45, yt: 10 }, "6": { yo: 450, om: 25, os: 50, yt: 10 }, "7": { yo: 490, om: 20, os: 55, yt: 15 }, "8": { yo: 440, om: 35, os: 40, yt: 10 }, "9": { yo: 470, om: 25, os: 50, yt: 15 }, "10": { yo: 500, om: 20, os: 55, yt: 10 }, "11": { yo: 430, om: 30, os: 45, yt: 10 }, "12": { yo: 460, om: 25, os: 50, yt: 15 }, "13": { yo: 480, om: 20, os: 55, yt: 10 }, "14": { yo: 440, om: 35, os: 40, yt: 15 }, "15": { yo: 490, om: 25, os: 50, yt: 10 } } },
      "210": { pembagiTanggal: 15, days: { "1": { yo: 450, om: 35, os: 45, yt: 15 }, "2": { yo: 500, om: 30, os: 55, yt: 10 }, "3": { yo: 470, om: 40, os: 50, yt: 20 }, "4": { yo: 520, om: 25, os: 60, yt: 10 }, "5": { yo: 460, om: 35, os: 50, yt: 15 }, "6": { yo: 490, om: 30, os: 55, yt: 10 }, "7": { yo: 530, om: 20, os: 65, yt: 20 }, "8": { yo: 480, om: 40, os: 50, yt: 10 }, "9": { yo: 510, om: 30, os: 60, yt: 15 }, "10": { yo: 540, om: 25, os: 65, yt: 10 }, "11": { yo: 470, om: 35, os: 50, yt: 15 }, "12": { yo: 500, om: 30, os: 55, yt: 20 }, "13": { yo: 520, om: 25, os: 60, yt: 10 }, "14": { yo: 480, om: 40, os: 50, yt: 15 }, "15": { yo: 530, om: 30, os: 65, yt: 10 } } }
    };
  }
  if (!db.breakdownPlan[sampleMonth] || Object.keys(db.breakdownPlan[sampleMonth]).length === 0) {
    db.breakdownPlan[sampleMonth] = JSON.parse(JSON.stringify(db.breakdownRealisasi[sampleMonth]));
  }

  cachedDb = db;
  return db;
}

function saveData(data: any) {
  // Update the in-memory copy immediately so the very next request (even in
  // the same tick) sees the new data without touching the disk.
  cachedDb = data;
  dashboardCacheDirty = true;

  // Debounce the actual disk write: if several saves happen in quick
  // succession (common during data entry), we only write once instead of
  // blocking the event loop on every single save.
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => {
    safeWriteFile(DATA_FILE, JSON.stringify(cachedDb, null, 2));
    writeTimeout = null;
  }, 300);
}

// PROXY FUNCTION DISABLED TO PREVENT SPREADSHEET CONFLICTS AND DATA LOSS
async function callProxy(action: string, payload: any = null, method: "GET" | "POST" = "GET") {
  return null;
}

// Akumulasi total penjualan tim dari data REALISASI di menu "BD & Realisasi"
// (db.breakdownRealisasi[month][area].days[tgl].{yo,om,os,yt}), bukan lagi dari BL38 sheet.
function getRealisasiAccumulation(db: any, month: string) {
  const realisasiMonth = (db.breakdownRealisasi && (db.breakdownRealisasi[month] || db.breakdownRealisasi["2026-07"])) || {};
  let totalYo = 0, totalOm = 0, totalOs = 0, totalYt = 0;
  const perArea: Record<string, { yo: number; om: number; os: number; yt: number; total: number; pembagiTanggal: number }> = {};

  Object.keys(realisasiMonth).forEach(area => {
    const areaData = realisasiMonth[area];
    let ayo = 0, aom = 0, aos = 0, ayt = 0;
    const days = areaData && areaData.days ? areaData.days : areaData;
    const pembagiTanggal = (areaData && areaData.pembagiTanggal > 0) ? Number(areaData.pembagiTanggal) : 15;
    
    if (days && typeof days === "object") {
      Object.values(days).forEach((d: any) => {
        if (!d) return;
        ayo += Number(d.yo) || 0;
        aom += Number(d.om) || 0;
        aos += Number(d.os) || 0;
        ayt += Number(d.yt) || 0;
      });
    }
    perArea[area] = { yo: ayo, om: aom, os: aos, yt: ayt, total: ayo + aom + aos + ayt, pembagiTanggal };
    totalYo += ayo; totalOm += aom; totalOs += aos; totalYt += ayt;
  });

  return { totalYo, totalOm, totalOs, totalYt, total: totalYo + totalOm + totalOs + totalYt, perArea, realisasiMonth };
}

// DYNAMIC SUMMARY CALCULATION (FOR SIMULATOR FALLBACK)
// calculateDashboardDP1 loops over every transaction for every YL — fairly
// heavy. Since it only needs to change when the underlying data actually
// changes (saveData() flips dashboardCacheDirty), we memoize the result
// instead of recomputing it from scratch on every poll (every 20s per
// connected device).
function getCachedDashboardDP1(db: any) {
  if (dashboardCacheDirty || !dashboardDP1Cache) {
    dashboardDP1Cache = calculateDashboardDP1(db);
    dashboardCacheDirty = false;
  }
  return dashboardDP1Cache;
}

function calculateDashboardDP1(db: any) {
  const txs = db.transactions || [];
  const targetYL = db.targetYL || {};

  // Dynamically determine current active month from latest transactions or current date
  const latestTxDate = txs.length > 0 ? txs[txs.length - 1].tanggal : new Date().toISOString().split("T")[0];
  const currentMonth = latestTxDate.substring(0, 7);
  let currentMonthTxs = txs.filter((t: any) => t.tanggal.startsWith(currentMonth));
  if (currentMonthTxs.length === 0 && txs.length > 0) {
    currentMonthTxs = txs;
  }

  // Akumulasi BB & Potensi Sektor (dari plg pjl / txs)
  let sRmh = 0, sPsr = 0, sSkh = 0, sKtr = 0, sTk = 0, sIb = 0;
  let totalPb = 0, totalBb = 0, totalSampahBotol = 0;

  currentMonthTxs.forEach((t: any) => {
    sRmh += (t.rmh_yo||0) + (t.rmh_om||0) + (t.rmh_os||0) + (t.rmh_yt||0);
    sPsr += (t.psr_yo||0) + (t.psr_om||0) + (t.psr_os||0) + (t.psr_yt||0);
    sSkh += (t.skh_yo||0) + (t.skh_om||0) + (t.skh_os||0) + (t.skh_yt||0);
    sKtr += (t.ktr_yo||0) + (t.ktr_om||0) + (t.ktr_os||0) + (t.ktr_yt||0);
    sTk += (t.tk_yo||0) + (t.tk_om||0) + (t.tk_os||0) + (t.tk_yt||0);
    sIb += (t.ib_yo||0) + (t.ib_om||0) + (t.ib_os||0) + (t.ib_yt||0);

    totalPb += (t.pb_p||0) + (t.pb_s||0);
    totalBb += (t.bb_yo||0) + (t.bb_om||0) + (t.bb_os||0) + (t.bb_yt||0);
    totalSampahBotol += (t.apk_botol||0);
  });

  // Total penjualan tim, komposisi, dan rata-rata produk diambil dari akumulasi total REALISASI di menu "BD & Realisasi"
  const realisasiAcc = getRealisasiAccumulation(db, currentMonth);
  const totalPenjualan = realisasiAcc.total;
        
  const ylList = db.ylList || INITIAL_YL_LIST;
  const names = ylList.map((y: any) => y.nama);
  const perYL: any = {};
  
  let teamTotalRata2 = 0;
  let teamTotalYoRata2 = 0;
  let teamTotalOmRata2 = 0;
  let teamTotalOsRata2 = 0;
  let teamTotalYtRata2 = 0;
  let teamTotalPembagi = 0;

  names.forEach(name => {
    let ylItem = ylList.find((y: any) => y.nama === name);
    const area = ylItem ? ylItem.area : name.substring(0, 3);
    if (!ylItem) ylItem = ylList.find((y: any) => y.area === area || (y.nama && String(y.nama).startsWith(area)));
    const ylTxs = currentMonthTxs.filter((t: any) => t.nama === name || (t.nama && String(t.nama).startsWith(area)));
    
    let ylBb = 0;
    ylTxs.forEach((t: any) => {
      ylBb += (t.bb_yo||0) + (t.bb_om||0) + (t.bb_os||0) + (t.bb_yt||0);
    });

    // Akumulasi per YL ikut data Realisasi (menu BD & Realisasi) area ybs.
    const areaRealisasi = realisasiAcc.perArea[area];
    const ylTotal = (areaRealisasi && areaRealisasi.total > 0) ? areaRealisasi.total : 0;

    const tgtObj = (targetYL && (targetYL[area] || targetYL[`${area}_${currentMonth}`] || targetYL[`${area}_2026-07`])) || {
      target: ylItem?.target ?? 0,
      bln_lalu: ylItem?.bln_lalu ?? 0,
      thn_lalu: ylItem?.thn_lalu ?? 0
    };
    
    const divisor = areaRealisasi ? areaRealisasi.pembagiTanggal : 15;
    const ylRata2 = divisor > 0 ? ylTotal / divisor : 0;
    teamTotalRata2 += ylRata2;
    teamTotalYoRata2 += divisor > 0 && areaRealisasi ? areaRealisasi.yo / divisor : 0;
    teamTotalOmRata2 += divisor > 0 && areaRealisasi ? areaRealisasi.om / divisor : 0;
    teamTotalOsRata2 += divisor > 0 && areaRealisasi ? areaRealisasi.os / divisor : 0;
    teamTotalYtRata2 += divisor > 0 && areaRealisasi ? areaRealisasi.yt / divisor : 0;
    teamTotalPembagi += divisor;

    perYL[area] = {
      nama: name,
      akumulasi: ylTotal,
      yo: areaRealisasi ? areaRealisasi.yo : 0,
      om: areaRealisasi ? areaRealisasi.om : 0,
      os: areaRealisasi ? areaRealisasi.os : 0,
      yt: areaRealisasi ? areaRealisasi.yt : 0,
      rata2: ylRata2,
      hariAktif: divisor,
      pembagi: divisor,
      targetYL: Number(tgtObj.target ?? 0),
      bulanLaluYL: Number(tgtObj.bln_lalu ?? 0),
      tahunLaluYL: Number(tgtObj.thn_lalu ?? 0),
      bbYL: ylBb
    };
  });

  // Calculate dynamic target totals across all YLs
  let targetTotalSum = 0, blnLaluTotalSum = 0, thnLaluTotalSum = 0;
  Object.keys(perYL).forEach(area => {
    targetTotalSum += perYL[area].targetYL;
    blnLaluTotalSum += perYL[area].bulanLaluYL;
    thnLaluTotalSum += perYL[area].tahunLaluYL;
  });

  if (db.targetTKU) {
    if (db.targetTKU.target !== undefined && Number(db.targetTKU.target) >= 0 && (Number(db.targetTKU.target) > 0 || targetTotalSum === 0)) targetTotalSum = Number(db.targetTKU.target);
    if (db.targetTKU.bln_lalu !== undefined && Number(db.targetTKU.bln_lalu) >= 0 && (Number(db.targetTKU.bln_lalu) > 0 || blnLaluTotalSum === 0)) blnLaluTotalSum = Number(db.targetTKU.bln_lalu);
    if (db.targetTKU.thn_lalu !== undefined && Number(db.targetTKU.thn_lalu) >= 0 && (Number(db.targetTKU.thn_lalu) > 0 || thnLaluTotalSum === 0)) thnLaluTotalSum = Number(db.targetTKU.thn_lalu);
  }

  const rataHarian = teamTotalRata2;
  const ylCount = names.length > 0 ? names.length : 10;

  // Tren penjualan vs BB: Tren penjualan dari realisasi, BB dari transaksi PLG PJL
  let graphDates: string[] = [];
  let graphPenjualan: number[] = [];
  let graphBalikBotol: number[] = [];

  const realisasiMonth = realisasiAcc.realisasiMonth;
  
  for (let d = 1; d <= 31; d++) {
    let daySales = 0;
    let dayBbFromRealisasi = 0;
    Object.keys(realisasiMonth).forEach(area => {
      const rData = realisasiMonth[area];
      const days = rData && rData.days ? rData.days : rData;
      if (days && days[String(d)]) {
        const dObj = days[String(d)];
        daySales += (Number(dObj.yo) || 0) + (Number(dObj.om) || 0) + (Number(dObj.os) || 0) + (Number(dObj.yt) || 0);
        dayBbFromRealisasi += (Number(dObj.bb_yo) || 0) + (Number(dObj.bb_om) || 0) + (Number(dObj.bb_os) || 0) + (Number(dObj.bb_yt) || 0) + (Number(dObj.bb) || 0);
      }
    });

    const dayStrPadded = String(d).padStart(2, '0');
    const matchDatePadded = `${currentMonth}-${dayStrPadded}`;
    const matchDateUnpadded = `${currentMonth}-${d}`;
    const txBbVal = currentMonthTxs.filter((t: any) => 
      t.tanggal === matchDatePadded || 
      t.tanggal === matchDateUnpadded || 
      t.tanggal === String(d) || 
      t.tanggal === dayStrPadded ||
      (t.tanggal && t.tanggal.endsWith(`-${dayStrPadded}`))
    ).reduce((sum: number, t: any) => sum + (t.bb_yo||0) + (t.bb_om||0) + (t.bb_os||0) + (t.bb_yt||0), 0);

    const bbVal = Math.max(dayBbFromRealisasi, txBbVal);

    if (daySales > 0 || bbVal > 0) {
      graphDates.push(String(d));
      graphPenjualan.push(daySales);
      graphBalikBotol.push(bbVal);
    }
  }

  // (Simulator fallback logic removed to prevent mock data)

  return {
    totalPenjualan,
    rataHarian,
    salesPerYl: teamTotalPembagi > 0 ? totalPenjualan / teamTotalPembagi : 0,
    jwp: teamTotalPembagi,
    rataItem: {
      YO: teamTotalYoRata2,
      OM: teamTotalOmRata2,
      OS: teamTotalOsRata2,
      YT: teamTotalYtRata2
    },
    vsTarget: targetTotalSum > 0 ? (rataHarian / targetTotalSum) * 100 : 100,
    vsBulanLalu: blnLaluTotalSum > 0 ? (rataHarian / blnLaluTotalSum) * 100 : 100,
    vsTahunLalu: thnLaluTotalSum > 0 ? (rataHarian / thnLaluTotalSum) * 100 : 100,
    targetTim: {
      target: targetTotalSum,
      bulanLalu: blnLaluTotalSum,
      tahunLalu: thnLaluTotalSum,
      rata2: rataHarian
    },
    bbTimRaw: totalBb,
    hariAktif: teamTotalPembagi > 0 ? teamTotalPembagi / ylCount : 0,
    perYL,
    sektorTim: {
      rumah: sRmh,
      pasar: sPsr,
      sekolah: sSkh,
      kantor: sKtr,
      toko: sTk,
      ib: sIb
    },
    grafikHarian: {
      tanggal: graphDates,
      penjualan: graphPenjualan,
      balikBotol: graphBalikBotol
    },
    plgPjlManual: db.plgPjlManual || {},
    potensiTembus: db.potensiTembus || {}
  };
}

// API ENDPOINTS

// 1. Script URL Configuration
app.get("/api/getScriptUrl", (req, res) => {
  const db = loadData();
  res.json({ scriptUrl: db.scriptUrl || "" });
});

app.post("/api/saveScriptUrl", (req, res) => {
  const { scriptUrl } = req.body;
  const db = loadData();
  db.scriptUrl = scriptUrl;
  saveData(db);
  res.json({ ok: true });
});

app.get("/api/verifyIntegrity", (req, res) => {
  const db = loadData();
  const txs = db.transactions || [];
  
  let totalYo = 0, totalOm = 0, totalOs = 0, totalYt = 0, totalPb = 0, totalSampah = 0;
  const channelDiscrepancies: any[] = [];

  txs.forEach((t: any, idx: number) => {
    const yo = Number(t.tot_yo || 0);
    const om = Number(t.tot_om || 0);
    const os = Number(t.tot_os || 0);
    const yt = Number(t.tot_yt || 0);

    totalYo += yo;
    totalOm += om;
    totalOs += os;
    totalYt += yt;
    totalPb += Number(t.pb_p || 0) + Number(t.pb_s || 0);
    totalSampah += Number(t.apk_botol || 0);

    // Verify channel breakdown equality
    const rmhYo = Number(t.rmh_yo || 0), psrYo = Number(t.psr_yo || 0), skhYo = Number(t.skh_yo || 0), ktrYo = Number(t.ktr_yo || 0), tkYo = Number(t.tk_yo || 0), ibYo = Number(t.ib_yo || 0);
    const channelSumYo = rmhYo + psrYo + skhYo + ktrYo + tkYo + ibYo;
    if (yo > 0 && channelSumYo > 0 && yo !== channelSumYo) {
      channelDiscrepancies.push({
        row: idx + 2,
        nama: t.nama,
        tanggal: t.tanggal,
        field: "YO Channel Sum",
        expected: yo,
        actual: channelSumYo
      });
    }
  });

  const totalBottles = totalYo + totalOm + totalOs + totalYt;

  res.json({
    ok: true,
    txCount: txs.length,
    totalBottles,
    totals: { yo: totalYo, om: totalOm, os: totalOs, yt: totalYt, pb: totalPb, sampah: totalSampah },
    channelDiscrepancies,
    isHealthy: channelDiscrepancies.length === 0,
    timestamp: new Date().toISOString()
  });
});

// 2. PIN Management
app.get("/api/getPins", async (req, res) => {
  const db = loadData();
  res.json({ managerPin: db.managerPin, ylPins: db.ylPins });
});

app.post("/api/savePins", async (req, res) => {
  const { managerPin, ylPins } = req.body;
  const db = loadData();
  db.managerPin = managerPin;
  db.ylPins = ylPins;
  saveData(db);
  res.json({ ok: true });
});

// Helper to call Gemini AI with retries & model fallback (gemini-3.6-flash -> gemini-3.1-flash-lite)
async function generateGeminiWithRetry(params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY belum terpasang di server.");
  }

  const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash"];
  let lastError: any = null;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const modelName of modelsToTry) {
    const attempts = 3;
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.7,
          }
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const status = err.status || (err.error && err.error.status) || "";
        const msg = err.message || "";
        const isTransient = status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED" || msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE") || msg.includes("429");

        if (isTransient && i < attempts - 1) {
          console.warn(`[Gemini Retry] Model ${modelName} returned 503/UNAVAILABLE (attempt ${i + 1}/${attempts}). Waiting 1500ms...`);
          await sleep(status === "RESOURCE_EXHAUSTED" || msg.includes("429") ? 17000 : 1500);
        } else {
          console.warn(`[Gemini Fail] Model ${modelName} failed on attempt ${i + 1}/${attempts}:`, msg);
          break; // Try next model in list
        }
      }
    }
  }

  throw lastError || new Error("Model Gemini sedang mengalami lonjakan beban sementara. Silakan coba kembali beberapa saat lagi.");
}

// 2b. AI Chatbot Analysis and General Q&A
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, role, user_name } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    const db = loadData();
    const systemInstruction = `
Anda adalah "AI Jember 1 Pro Assistant", asisten pintar untuk sistem penjualan Yakult Unit DP Jember 1. 
Tugas Anda adalah membantu pengguna (baik sebagai ${role === "manager" ? "Manager Ahmad" : "Yakult Lady (Ibu " + user_name + ")"}) menganalisis data, memberikan rekomendasi, dan menjawab pertanyaan apa saja, termasuk di luar pekerjaan seperti Gemini AI umum.

Gunakan bahasa Indonesia yang ramah, sopan, natural, penuh semangat, dan profesional.

Berikut adalah Ringkasan Data Terkini di database aplikasi (tersimpan lokal di server):
- Daftar PIN YL: ${JSON.stringify(db.ylPins || {})}
- Target & Patokan Bulanan YL: ${JSON.stringify(db.targetYL || {})}
- Total Data Laporan Tersimpan: ${db.transactions ? db.transactions.length : 0} baris
- Sampel Transaksi Terkini (max 20): ${JSON.stringify((db.transactions || []).slice(-20))}
- Status Menu Kontes: ${db.kontes?.enabled ? "Aktif" : "Nonaktif"}
- Baris Data Kontes: ${JSON.stringify((db.kontes?.rows || []))}

Aturan:
1. Jika ditanya tentang penjualan, capaian, perbandingan rute, sisa botol, atau performa, analisa data di atas secara mendalam dan berikan rincian matematis yang akurat.
2. Jika ditanya pertanyaan umum di luar Yakult (seperti sains, sejarah, tips kehidupan, memasak, resep, hobi, teknologi, dll.), jawablah layaknya Gemini AI biasa dengan cerdas, informatif, dan mendalam.
3. Selalu beri motivasi positif khas budaya Yakult.
`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }]
    }));

    const contents = [
      ...chatHistory,
      { role: "user", parts: [{ text: message }] }
    ];

    const reply = await generateGeminiWithRetry({
      contents,
      systemInstruction,
      temperature: 0.7
    });

    res.json({ reply });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message || "Gagal menghubungi Gemini AI." });
  }
});

// 3. Floating Banner Motivasi
app.get("/api/getMotivasi", async (req, res) => {
  const db = loadData();
  if (!db.motivasi) {
    db.motivasi = { list: [...DEFAULT_MOTIVASI], terpilih: [...DEFAULT_MOTIVASI], intervalDetik: 30, enabled: true, chatbotName: "AI Jember 1 Pro", tkuName: "DP Jember 1" };
  }
  if (!db.motivasi.chatbotName) db.motivasi.chatbotName = "AI Jember 1 Pro";
  if (!db.motivasi.tkuName) db.motivasi.tkuName = "DP Jember 1";

  // Nama TKU & Chatbot murni dari data.json lokal — TIDAK ditimpa oleh data spreadsheet lagi,
  // supaya nama yang sudah diganti user tidak balik ke default sendiri.
  res.json(db.motivasi);
});

app.post("/api/saveMotivasi", async (req, res) => {
  try {
    const { list, terpilih, chatbotName, tkuName } = req.body || {};
    const db = loadData();
    if (!db.motivasi) {
      db.motivasi = { list: [...DEFAULT_MOTIVASI], terpilih: [...DEFAULT_MOTIVASI], intervalDetik: 30, enabled: true, chatbotName: "AI Jember 1 Pro", tkuName: "DP Jember 1" };
    }
    if (list !== undefined && Array.isArray(list)) db.motivasi.list = list;
    if (terpilih !== undefined && Array.isArray(terpilih)) db.motivasi.terpilih = terpilih;
    if (chatbotName !== undefined) db.motivasi.chatbotName = chatbotName;
    if (tkuName !== undefined) db.motivasi.tkuName = tkuName;
    saveData(db);

    res.json({ ok: true, motivasi: db.motivasi });
  } catch (err: any) {
    console.error("Error in saveMotivasi:", err);
    res.json({ ok: true });
  }
});

app.post("/api/saveChatbotName", async (req, res) => {
  try {
    const { name } = req.body || {};
    const db = loadData();
    if (!db.motivasi) {
      db.motivasi = { list: [...DEFAULT_MOTIVASI], terpilih: [...DEFAULT_MOTIVASI], intervalDetik: 30, enabled: true, chatbotName: "AI Jember 1 Pro", tkuName: "DP Jember 1" };
    }
    const cleanName = name ? String(name).trim() : "AI Jember 1 Pro";
    db.motivasi.chatbotName = cleanName;
    saveData(db);

    res.json({ ok: true, chatbotName: db.motivasi.chatbotName });
  } catch (err: any) {
    console.error("Error in saveChatbotName:", err);
    res.json({ ok: true });
  }
});

app.post("/api/saveTkuName", async (req, res) => {
  try {
    const { name } = req.body || {};
    const db = loadData();
    if (!db.motivasi) {
      db.motivasi = { list: [...DEFAULT_MOTIVASI], terpilih: [...DEFAULT_MOTIVASI], intervalDetik: 30, enabled: true, chatbotName: "AI Jember 1 Pro", tkuName: "DP Jember 1" };
    }
    const cleanName = name ? String(name).trim() : "DP Jember 1";
    db.motivasi.tkuName = cleanName;
    saveData(db);

    res.json({ ok: true, tkuName: db.motivasi.tkuName });
  } catch (err: any) {
    console.error("Error in saveTkuName:", err);
    res.json({ ok: true });
  }
});

app.post("/api/saveMotivasiInterval", async (req, res) => {
  const { detik } = req.body;
  const db = loadData();
  if (!db.motivasi) {
    db.motivasi = { list: [...DEFAULT_MOTIVASI], terpilih: [...DEFAULT_MOTIVASI], intervalDetik: 30, enabled: true, chatbotName: "AI Jember 1 Pro", tkuName: "DP Jember 1" };
  }
  db.motivasi.intervalDetik = detik;
  saveData(db);

  res.json({ ok: true });
});

app.post("/api/saveMotivasiEnabled", async (req, res) => {
  const { enabled } = req.body;
  const db = loadData();
  if (!db.motivasi) {
    db.motivasi = { list: [...DEFAULT_MOTIVASI], terpilih: [...DEFAULT_MOTIVASI], intervalDetik: 30, enabled: true, chatbotName: "AI Jember 1 Pro", tkuName: "DP Jember 1" };
  }
  db.motivasi.enabled = enabled;
  saveData(db);

  res.json({ ok: true });
});

app.post("/api/resetMotivasiDefault", async (req, res) => {
  const db = loadData();
  const existingChatbotName = db.motivasi?.chatbotName || "AI Jember 1 Pro";
  const existingTkuName = db.motivasi?.tkuName || "DP Jember 1";

  db.motivasi = {
    list: [...DEFAULT_MOTIVASI],
    terpilih: [...DEFAULT_MOTIVASI],
    intervalDetik: 30,
    enabled: true,
    chatbotName: existingChatbotName,
    tkuName: existingTkuName
  };
  saveData(db);

  res.json({ ok: true });
});

app.post("/api/clearMotivasiCache", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/bersihkanSampah", (req, res) => {
  res.json({ ok: true, deletedCount: 0 });
});

// 4. Papan Kontes
app.get("/api/getKontes", async (req, res) => {
  const db = loadData();
  res.json(db.kontes);
});

// 5. General Data Loading & Transactions
app.get("/api/getAll", async (req, res) => {
  const db = loadData();
  res.json({ transactions: db.transactions });
});

app.get("/api/getMine", async (req, res) => {
  const { nama } = req.query;
  const db = loadData();
  const area = String(nama).substring(0, 3);
  const myTxs = (db.transactions || []).filter((t: any) => t.nama === nama || (t.nama && String(t.nama).startsWith(area)));

  // Return targets for YL
  const targetYLList = Object.keys(db.targetYL || {})
    .filter(k => k.startsWith(area))
    .map(k => ({
      nama: nama,
      bulan: k.substring(4),
      target: db.targetYL[k].target,
      bln_lalu: db.targetYL[k].bln_lalu,
      thn_lalu: db.targetYL[k].thn_lalu,
      e6: db.targetYL[k].e6
    }));

  const myBreakdown = myTxs.map((t: any) => ({
    tanggal: t.tanggal,
    breakdown: { yo: t.plan_yo || 0, om: t.plan_om || 0, os: t.plan_os || 0, yt: t.plan_yt || 0 },
    realisasi: { yo: t.tot_yo || 0, om: t.tot_om || 0, os: t.tot_os || 0, yt: t.tot_yt || 0 }
  }));

  const currentMonthPlan = db.breakdownPlan && db.breakdownPlan["2026-07"] ? db.breakdownPlan["2026-07"][area] : null;
  const currentMonthAdminRealisasi = db.breakdownRealisasi && db.breakdownRealisasi["2026-07"] ? db.breakdownRealisasi["2026-07"][area] : null;

  res.json({
    transactions: myTxs,
    targetYL: targetYLList,
    breakdownRealisasi: myBreakdown,
    breakdownPlan: currentMonthPlan,
    adminBreakdownRealisasi: currentMonthAdminRealisasi,
    attention: db.attention || {}
  });
});

// GET /api/getBreakdownPlan
app.get("/api/getBreakdownPlan", (req, res) => {
  const month = (req.query.month as string) || "2026-07";
  const db = loadData();
  const planData = (db.breakdownPlan && db.breakdownPlan[month]) ? db.breakdownPlan[month] : {};
  const realisasiData = (db.breakdownRealisasi && db.breakdownRealisasi[month]) ? db.breakdownRealisasi[month] : {};
  res.json({ ok: true, month, breakdownPlan: planData, breakdownRealisasi: realisasiData });
});

// POST /api/saveBreakdownPlan
app.post("/api/saveBreakdownPlan", (req, res) => {
  const { month = "2026-07", breakdownPlan, breakdownRealisasi } = req.body;

  const db = loadData();
  if (breakdownPlan && typeof breakdownPlan === "object") {
    if (!db.breakdownPlan) db.breakdownPlan = {};
    db.breakdownPlan[month] = breakdownPlan;
  }
  if (breakdownRealisasi && typeof breakdownRealisasi === "object") {
    if (!db.breakdownRealisasi) db.breakdownRealisasi = {};
    db.breakdownRealisasi[month] = breakdownRealisasi;
  }

  saveData(db);
  res.json({ ok: true, message: "Data Breakdown Rencana & Realisasi berhasil disimpan." });
});

// GET /api/getLhppRealisasi
app.get("/api/getLhppRealisasi", (req, res) => {
  const date = (req.query.date as string) || "2026-07-24";
  const db = loadData();
  const lhppData = (db.lhppRealisasi && db.lhppRealisasi[date]) ? db.lhppRealisasi[date] : null;
  res.json({ ok: true, date, rows: lhppData?.rows || null, summary: lhppData?.summary || null });
});

// POST /api/saveLhppRealisasi
app.post("/api/saveLhppRealisasi", (req, res) => {
  const { date = "2026-07-24", rows, summary } = req.body;
  const db = loadData();
  if (!db.lhppRealisasi) db.lhppRealisasi = {};
  db.lhppRealisasi[date] = { rows, summary };
  saveData(db);
  res.json({ ok: true, message: "Data LHPP & LPPBJ Realisasi berhasil disimpan." });
});

app.get("/api/getDataYL", async (req, res) => {
  const { area } = req.query;
  const db = loadData();
  const currentMonth = "2026-07";
  const tgtObj = db.targetYL[`${area}_${currentMonth}`] || db.targetYL[area as string] || { target: 0, bln_lalu: 0, thn_lalu: 0, e6: 0 };

  const target = {
    YO: Math.floor(tgtObj.target * 0.9),
    OM: Math.floor(tgtObj.target * 0.05),
    OS: Math.floor(tgtObj.target * 0.03),
    YT: Math.floor(tgtObj.target * 0.02),
    ALL: tgtObj.target,
    e6: tgtObj.e6 || 0
  };

  const bulanLalu = {
    YO: Math.floor(tgtObj.bln_lalu * 0.9),
    OM: Math.floor(tgtObj.bln_lalu * 0.05),
    OS: Math.floor(tgtObj.bln_lalu * 0.03),
    YT: Math.floor(tgtObj.bln_lalu * 0.02),
    ALL: tgtObj.bln_lalu
  };

  const tahunLalu = {
    YO: Math.floor(tgtObj.thn_lalu * 0.9),
    OM: Math.floor(tgtObj.thn_lalu * 0.05),
    OS: Math.floor(tgtObj.thn_lalu * 0.03),
    YT: Math.floor(tgtObj.thn_lalu * 0.02),
    ALL: tgtObj.thn_lalu
  };

  // Calculate dynamic actual sales for the selected YL area to match the dashboard perfectly
  const names = Object.values(db.ylPins || INITIAL_DATA.ylPins) as string[];
  const name = names.find(n => n.startsWith(String(area)));
  const currentMonthTxs = (db.transactions || []).filter((t: any) => t.tanggal.startsWith(currentMonth));
  const ylTxs = currentMonthTxs.filter((t: any) => t.nama === name);
  let ylYo = 0, ylOm = 0, ylOs = 0, ylYt = 0;
  ylTxs.forEach((t: any) => {
    ylYo += t.tot_yo || 0;
    ylOm += t.tot_om || 0;
    ylOs += t.tot_os || 0;
    ylYt += t.tot_yt || 0;
  });
  const areaStr = String(area).substring(0, 3);
  const realAcc = getRealisasiAccumulation(db, currentMonth);
  const areaData = realAcc.perArea[areaStr];
  const actualFromBreakdown = areaData ? areaData.total : 0;
  const ylTotalActual = actualFromBreakdown > 0 ? actualFromBreakdown : (ylYo + ylOm + ylOs + ylYt);

  let pembagi = tgtObj.e6 || 12;
  if (db.breakdownRealisasi && db.breakdownRealisasi[currentMonth] && db.breakdownRealisasi[currentMonth][areaStr]) {
    pembagi = db.breakdownRealisasi[currentMonth][areaStr].pembagiTanggal || pembagi;
  }
  const avgSales = pembagi > 0 ? ylTotalActual / pembagi : 0;

  const compCfg = db.compensationConfig || DEFAULT_COMP_CONFIG;
  let factor = compCfg.tiers[0].rate;
  const sortedTiers = [...compCfg.tiers].sort((a, b) => b.threshold - a.threshold);
  for (const t of sortedTiers) {
    if (avgSales >= t.threshold) {
      factor = t.rate;
      break;
    }
  }

  const kompensasi = ylTotalActual * factor;
  const pph = Math.floor(kompensasi * (compCfg.pphRate / 100));
  const jkk = compCfg.jkkJkm;
  const jht = compCfg.jht;
  const kresekDll = 0;
  const kompenBersih = kompensasi - pph - jkk - jht - kresekDll;

  res.json({
    target: {
      target,
      bulanLalu,
      tahunLalu
    },
    kompensasi: {
      kompensasi,
      pph,
      jkk,
      jht,
      kresekDll,
      kompenBersih
    }
  });
});

// Attention / Catatan Manager per YL
app.get("/api/getAttention", (req, res) => {
  const db = loadData();
  res.json({ attention: db.attention || {} });
});

app.post("/api/saveAttention", (req, res) => {
  const { area, text } = req.body;
  const db = loadData();
  if (!db.attention) db.attention = {};
  if (area) {
    db.attention[area] = text || "";
  }
  saveData(db);
  res.json({ ok: true, attention: db.attention });
});

// YL List & PIN Management (20 YL)
app.get("/api/getYlList", (req, res) => {
  const db = loadData();
  res.json({ ylList: db.ylList || INITIAL_YL_LIST, managerPin: db.managerPin || "1111" });
});

app.post("/api/saveYlList", (req, res) => {
  const { ylList, managerPin } = req.body;
  const db = loadData();
  const oldList = db.ylList || INITIAL_YL_LIST;

  if (Array.isArray(ylList)) {
    // Detect renamed YLs by matching area
    const nameChanges: Array<{ area: string; oldNama: string; newNama: string }> = [];
    ylList.forEach((newY: any) => {
      const oldY = oldList.find((o: any) => String(o.area).substring(0, 3) === String(newY.area).substring(0, 3));
      if (oldY && oldY.nama && newY.nama && oldY.nama.trim() !== newY.nama.trim()) {
        nameChanges.push({
          area: String(newY.area).substring(0, 3),
          oldNama: oldY.nama.trim(),
          newNama: newY.nama.trim()
        });
      }
    });

    db.ylList = ylList;

    // Apply name changes across all database objects
    nameChanges.forEach(({ area, oldNama, newNama }) => {
      const oldShort = oldNama.startsWith(area) ? oldNama.substring(area.length).trim() : oldNama;
      const newShort = newNama.startsWith(area) ? newNama.substring(area.length).trim() : newNama;

      // 1. Transactions
      if (Array.isArray(db.transactions)) {
        db.transactions.forEach((t: any) => {
          if (
            t.nama === oldNama ||
            (t.area && String(t.area).substring(0, 3) === area) ||
            (t.nama && (t.nama === oldNama || (oldShort && t.nama.includes(oldShort))))
          ) {
            t.nama = newNama;
          }
        });
      }

      // 2. targetYL (keyed by e.g. "201_2026-07" or "201 Gusrina_2026-07")
      if (db.targetYL && typeof db.targetYL === "object") {
        Object.keys(db.targetYL).forEach(k => {
          if (k.startsWith(oldNama) || k.startsWith(area + "_") || (oldShort && k.includes(oldShort))) {
            const newK = k.replace(oldNama, newNama).replace(oldShort, newShort);
            if (newK !== k) {
              db.targetYL[newK] = db.targetYL[k];
              delete db.targetYL[k];
            }
          }
        });
      }

      // 3. breakdownPlan / breakdownRealisasi / managerRealisasi / plgPjlManual
      ["breakdownPlan", "breakdownRealisasi", "managerRealisasi", "plgPjlManual"].forEach(storeKey => {
        if (db[storeKey] && typeof db[storeKey] === "object") {
          Object.keys(db[storeKey]).forEach(month => {
            const mObj = db[storeKey][month];
            if (mObj && typeof mObj === "object") {
              if (mObj[area] && mObj[area].nama) {
                mObj[area].nama = newNama;
              }
              if (mObj[oldNama]) {
                mObj[newNama] = mObj[oldNama];
                mObj[newNama].nama = newNama;
                delete mObj[oldNama];
              }
            }
          });
        }
      });

      // 4. Attention
      if (db.attention && typeof db.attention === "object") {
        if (db.attention[oldNama]) {
          db.attention[newNama] = db.attention[oldNama];
          delete db.attention[oldNama];
        }
      }
    });

    // Rebuild ylPins strictly from active non-resign YLs in ylList
    db.ylPins = {};
    ylList.forEach((y: any) => {
      if (y.pin && y.nama && y.status !== "Resign") {
        db.ylPins[y.pin] = y.nama;
      }
    });

    // Remove targetYL entries for areas that no longer exist
    const activeAreas = new Set(ylList.map((y: any) => String(y.area).substring(0, 3)));
    if (db.targetYL && typeof db.targetYL === "object") {
      Object.keys(db.targetYL).forEach(key => {
        const areaKey = key.split("_")[0];
        if (!activeAreas.has(areaKey) && !activeAreas.has(areaKey.substring(0, 3))) {
          delete db.targetYL[key];
        }
      });
    }
  }

  if (managerPin) db.managerPin = managerPin;
  saveData(db);
  res.json({ ok: true, ylList: db.ylList, managerPin: db.managerPin, ylPins: db.ylPins });
});

// Setting Targets & Pembagi Tanggal
app.get("/api/getSettingTargets", (req, res) => {
  const db = loadData();
  const pembagiTanggal = db.pembagiTanggal || db.ca25 || 15;
  const targetTKU = db.targetTKU || { target: 0, bln_lalu: 0, thn_lalu: 0 };
  const targetYL = db.targetYL || {};
  res.json({ pembagiTanggal, targetTKU, targetYL });
});

app.post("/api/saveSettingTargets", (req, res) => {
  const { pembagiTanggal, targetTKU, targetYL } = req.body;
  const db = loadData();
  if (pembagiTanggal !== undefined) {
    db.pembagiTanggal = Number(pembagiTanggal);
    db.ca25 = Number(pembagiTanggal);
  }
  if (targetTKU) {
    db.targetTKU = { ...(db.targetTKU || {}), ...targetTKU };
  }
  if (targetYL) {
    db.targetYL = { ...(db.targetYL || {}), ...targetYL };
  }
  saveData(db);
  res.json({ ok: true, pembagiTanggal: db.pembagiTanggal, targetTKU: db.targetTKU, targetYL: db.targetYL });
});

// Compensation Config
app.get("/api/getCompensationConfig", (req, res) => {
  const db = loadData();
  res.json({ config: db.compensationConfig || DEFAULT_COMP_CONFIG });
});

app.post("/api/saveCompensationConfig", (req, res) => {
  const { config } = req.body;
  const db = loadData();
  if (config && Array.isArray(config.tiers)) {
    db.compensationConfig = config;
    saveData(db);
  }
  res.json({ ok: true, config: db.compensationConfig });
});

// Manager Input Realisasi Penjualan & Breakdown Tim
app.post("/api/saveManagerRealisasi", (req, res) => {
  const { tanggal, nama, tot_yo, tot_om, tot_os, tot_yt, plan_yo, plan_om, plan_os, plan_yt } = req.body;
  if (!tanggal || !nama) return res.status(400).json({ error: "Tanggal dan nama YL wajib diisi." });
  const db = loadData();
  if (!db.transactions) db.transactions = [];

  let tx = db.transactions.find((t: any) => t.tanggal === tanggal && t.nama === nama);
  if (!tx) {
    tx = {
      tanggal,
      nama,
      tot_yo: Number(tot_yo) || 0,
      tot_om: Number(tot_om) || 0,
      tot_os: Number(tot_os) || 0,
      tot_yt: Number(tot_yt) || 0,
      plan_yo: Number(plan_yo) || 0,
      plan_om: Number(plan_om) || 0,
      plan_os: Number(plan_os) || 0,
      plan_yt: Number(plan_yt) || 0,
      rmh_yo: 0, rmh_om: 0, rmh_os: 0, rmh_yt: 0,
      psr_yo: 0, psr_om: 0, psr_os: 0, psr_yt: 0,
      skh_yo: 0, skh_om: 0, skh_os: 0, skh_yt: 0,
      ktr_yo: 0, ktr_om: 0, ktr_os: 0, ktr_yt: 0,
      tk_yo: 0, tk_om: 0, tk_os: 0, tk_yt: 0,
      ib_yo: 0, ib_om: 0, ib_os: 0, ib_yt: 0,
      bb_yo: 0, bb_om: 0, bb_os: 0, bb_yt: 0,
      pb_p: 0, pb_s: 0, f_plg: 0, f_rk: 0, f_ra: 0, f_rb: 0, apk_plg: 0, apk_botol: 0
    };
    db.transactions.push(tx);
  } else {
    if (tot_yo !== undefined) tx.tot_yo = Number(tot_yo);
    if (tot_om !== undefined) tx.tot_om = Number(tot_om);
    if (tot_os !== undefined) tx.tot_os = Number(tot_os);
    if (tot_yt !== undefined) tx.tot_yt = Number(tot_yt);
    if (plan_yo !== undefined) tx.plan_yo = Number(plan_yo);
    if (plan_om !== undefined) tx.plan_om = Number(plan_om);
    if (plan_os !== undefined) tx.plan_os = Number(plan_os);
    if (plan_yt !== undefined) tx.plan_yt = Number(plan_yt);
  }

  saveData(db);
  res.json({ ok: true, transaction: tx });
});


// Kirim Rekap Bulanan ke DP1
app.post("/api/sendToDP1", async (req, res) => {
  const db = loadData();
  const ylList = db.ylList || INITIAL_YL_LIST;
  const summary: any[] = [];

  ylList.forEach((yl: any) => {
    const area = yl.area;
    const name = yl.nama;
    const ylTxs = (db.transactions || []).filter((t: any) => t.nama === name || (t.nama && String(t.nama).startsWith(area)));

    let yo = 0, om = 0, os = 0, yt = 0;
    ylTxs.forEach((t: any) => {
      yo += t.tot_yo || 0;
      om += t.tot_om || 0;
      os += t.tot_os || 0;
      yt += t.tot_yt || 0;
    });

    summary.push({
      area,
      nama: name,
      yo,
      om,
      os,
      yt,
      total: yo + om + os + yt
    });
  });

  if (db.scriptUrl) {
    await callProxy("sendToDP1", { summary }, "POST").catch(e => console.error("Error sending to DP1 proxy:", e));
  }

  res.json({
    ok: true,
    timestamp: new Date().toLocaleString("id-ID"),
    message: "Rekap bulanan per YL per item berhasil dikirim ke DP1!",
    exportedCount: summary.length,
    summary
  });
});

app.post("/api/saveTransaction", async (req, res) => {
  const data = req.body;
  const db = loadData();

  if (!db.transactions) db.transactions = [];
  
  // Check if data already exists for this date and YL in local database
  const existingTx = db.transactions.find((t: any) => t.tanggal === data.tanggal && t.nama === data.nama);
  if (existingTx && !data.allowOverwrite) {
    return res.status(400).json({
      ok: false,
      alreadyExists: true,
      error: `Data penjualan untuk tanggal ${data.tanggal} sudah ada di sheet! Tidak dapat disimpan ulang.`
    });
  }

  const idx = db.transactions.findIndex((t: any) => t.tanggal === data.tanggal && t.nama === data.nama);
  if (idx !== -1) {
    db.transactions[idx] = data;
  } else {
    db.transactions.push(data);
  }

  saveData(db);
  res.json({ ok: true });
});

app.post("/api/saveTargetYL", async (req, res) => {
  const { nama, bulan, target, bln_lalu, thn_lalu, e6 } = req.body;
  const db = loadData();

  const cleanNama = cleanYlName(String(nama || ""));
  const ylItem = (db.ylList || INITIAL_YL_LIST).find((y: any) => cleanYlName(y.nama) === cleanNama || y.nama === nama);
  const area = ylItem ? ylItem.area : String(nama).substring(0, 3);

  if (!db.targetYL) db.targetYL = {};
  const targetObj = { target: Number(target) || 0, bln_lalu: Number(bln_lalu) || 0, thn_lalu: Number(thn_lalu) || 0, e6: Number(e6) || 0 };
  
  db.targetYL[area] = targetObj;
  if (bulan) {
    db.targetYL[`${area}_${bulan}`] = targetObj;
  }
  saveData(db);

  res.json({ ok: true, targetYL: db.targetYL });
});

// 6. Evaluasi Harian
app.get("/api/getEvaluasi", async (req, res) => {
  const db = loadData();
  const dashboard = getCachedDashboardDP1(db);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const ylList = db.ylList || INITIAL_YL_LIST;
  const names = ylList.map((y: any) => y.nama);
  
  const breakdownRealisasiMonth = db.breakdownRealisasi && (db.breakdownRealisasi[currentMonth] || db.breakdownRealisasi["2026-07"]) || {};
  const plgPjlManual = db.plgPjlManual || {};

  const tableData = names.map(name => {
    const ylItem = ylList.find((y: any) => y.nama === name);
    const area = ylItem ? ylItem.area : name.substring(0, 3);
    const yl = dashboard.perYL[area] || { yo:0, om:0, os:0, yt:0, akumulasi:0, bbYL:0, rata2:0 };
    const ylTxs = db.transactions.filter((t: any) => t.nama === name && t.tanggal && t.tanggal.startsWith(currentMonth));
    
    const areaData = breakdownRealisasiMonth[area];
    const pembagi = areaData && areaData.pembagiTanggal > 0 ? Number(areaData.pembagiTanggal) : 15;
    
    // Hari ini is date = pembagi
    const hariIniDateStr = currentMonth + "-" + String(pembagi).padStart(2, '0');
    const latestTx = ylTxs.find((t: any) => t.tanggal === hariIniDateStr) || {};
    
    // Rata2 Minggu Ini (7 days ending at pembagi)
    let sumMingguIni = 0;
    for (let i = 0; i < 7; i++) {
      let d = pembagi - i;
      if (d > 0 && areaData && areaData.days && areaData.days[String(d)]) {
        let dx = areaData.days[String(d)];
        sumMingguIni += (dx.yo||0) + (dx.om||0) + (dx.os||0) + (dx.yt||0);
      }
    }
    const rataMingguIni = Math.trunc(sumMingguIni / 7);

    // Rata2 Minggu Lalu (7 days before that)
    let sumMingguLalu = 0;
    for (let i = 0; i < 7; i++) {
      let d = pembagi - 7 - i;
      if (d > 0 && areaData && areaData.days && areaData.days[String(d)]) {
        let dx = areaData.days[String(d)];
        sumMingguLalu += (dx.yo||0) + (dx.om||0) + (dx.os||0) + (dx.yt||0);
      }
    }
    const rataMingguLalu = Math.trunc(sumMingguLalu / 7);

    const dayData = (areaData && areaData.days && areaData.days[String(pembagi)]) || {};
    const mainYo = (dayData.yo !== undefined && dayData.yo !== null && dayData.yo > 0) ? dayData.yo : (latestTx.tot_yo || 0);
    const mainOm = (dayData.om !== undefined && dayData.om !== null && dayData.om > 0) ? dayData.om : (latestTx.tot_om || 0);
    const mainOs = (dayData.os !== undefined && dayData.os !== null && dayData.os > 0) ? dayData.os : (latestTx.tot_os || 0);
    const mainYt = (dayData.yt !== undefined && dayData.yt !== null && dayData.yt > 0) ? dayData.yt : (latestTx.tot_yt || 0);
    const todayAll = mainYo + mainOm + mainOs + mainYt;

    const vsMingguLaluPct = rataMingguLalu > 0 ? Math.trunc((rataMingguIni / rataMingguLalu) * 100) : 0;

    const rumahHariIni = (latestTx.rmh_yo||0) + (latestTx.rmh_om||0) + (latestTx.rmh_os||0) + (latestTx.rmh_yt||0);
    const rumahAkm = ylTxs.reduce((sum: number, t: any) => sum + (t.rmh_yo||0) + (t.rmh_om||0) + (t.rmh_os||0) + (t.rmh_yt||0), 0);
    const allAkmSektor = ylTxs.reduce((sum: number, t: any) => sum +
      ((t.rmh_yo||0) + (t.rmh_om||0) + (t.rmh_os||0) + (t.rmh_yt||0)) +
      ((t.psr_yo||0) + (t.psr_om||0) + (t.psr_os||0) + (t.psr_yt||0)) +
      ((t.skh_yo||0) + (t.skh_om||0) + (t.skh_os||0) + (t.skh_yt||0)) +
      ((t.ktr_yo||0) + (t.ktr_om||0) + (t.ktr_os||0) + (t.ktr_yt||0)) +
      ((t.tk_yo||0)  + (t.tk_om||0)  + (t.tk_os||0)  + (t.tk_yt||0)) +
      ((t.ib_yo||0)  + (t.ib_om||0)  + (t.ib_os||0)  + (t.ib_yt||0)), 0);
    const persenRumah = allAkmSektor > 0 ? Math.trunc((rumahAkm / allAkmSektor) * 100) : 0;
    
    // Plg pjl manual logic for rb vs plg
        const plg = ylTxs.reduce((sum: number, t: any) => sum + (t.f_plg||0), 0);
    const rb = ylTxs.reduce((sum: number, t: any) => sum + (t.f_rb||0), 0);
    const persenRbPlg = plg > 0 ? Math.trunc((rb / plg) * 100) : 0;
    
    const pbPagi = latestTx.pb_p || 0;
    const pbSore = latestTx.pb_s || 0;
    const pbAkm = ylTxs.reduce((sum: number, t: any) => sum + (t.pb_p||0) + (t.pb_s||0), 0);
    
    const sampahHariIni = latestTx.apk_botol || 0;
    const sampahAkm = ylTxs.reduce((sum: number, t: any) => sum + (t.apk_botol||0), 0);
    const vs900 = sampahAkm - 900;
    
    const bbHariIni = (latestTx.bb_yo||0) + (latestTx.bb_om||0) + (latestTx.bb_os||0) + (latestTx.bb_yt||0);
    const bbPersenHariIni = (todayAll + bbHariIni) > 0 ? Math.trunc((bbHariIni / (todayAll + bbHariIni)) * 100) : 0;
    const bbAkm = yl.bbYL || 0;
    const bbPersenAkm = (yl.akumulasi + bbAkm) > 0 ? Math.trunc((bbAkm / (yl.akumulasi + bbAkm)) * 100) : 0;

    return [
      area,
      name,
      rataMingguLalu,
      mainYo,
      mainOm,
      mainOs,
      mainYt,
      todayAll,
      yl.akumulasi,
      yl.yo,
      yl.om,
      yl.os,
      yl.yt,
      Math.trunc(yl.rata2),
      rataMingguIni,
      vsMingguLaluPct,
      rumahHariIni,
      rumahAkm,
      persenRumah,
      plg,
      rb,
      persenRbPlg,
      pbPagi,
      pbSore,
      pbAkm,
      sampahHariIni,
      sampahAkm,
      vs900,
      bbHariIni,
      bbPersenHariIni,
      bbAkm,
      bbPersenAkm
    ];
  });

  const totalRow = [
    "TOTAL", "",
    tableData.reduce((s: number, r: any) => s + (r[2]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[3]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[4]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[5]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[6]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[7]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[8]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[9]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[10]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[11]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[12]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[13]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[14]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[16]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[17]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[19]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[20]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[22]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[23]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[24]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[25]||0), 0),
    tableData.reduce((s: number, r: any) => s + (r[26]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[28]||0), 0),
    "0",
    tableData.reduce((s: number, r: any) => s + (r[30]||0), 0),
    "0"
  ];

  const analisis = tableData.map(r => ({
    area: r[0],
    nama: r[1],
    jualHariIni: r[7],
    rata2BulanBerjalan: r[13],
    vsMingguLaluPct: r[15],
    persenRumah: r[18],
    persenRbVsPlg: r[21],
    propagandaHariIni: r[22] + r[23],
    sampahBotol: r[26],
    bb: r[28]
  }));

  res.json({
    ok: true,
    evaluasiData: {
      dataRows: tableData,
      totalRow,
      analisis
    }
  });
});


app.get("/api/getPlgPjlData", async (req, res) => {
  const db = loadData();
  const ylList = db.ylList || INITIAL_YL_LIST;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const breakdownRealisasiMonth = db.breakdownRealisasi && (db.breakdownRealisasi[currentMonth] || db.breakdownRealisasi["2026-07"]) || {};
  
  let realisasiPembagi = 15;
  const brKeys = Object.keys(breakdownRealisasiMonth);
  if (brKeys.length > 0) {
    const p = breakdownRealisasiMonth[brKeys[0]]?.pembagiTanggal;
    if (p && Number(p) > 0) realisasiPembagi = Number(p);
  }

  const pembagiManager = realisasiPembagi;

  res.json({
    ok: true,
    ylList,
    pembagiManager,
    transactions: db.transactions || [],
    potensiTembus: db.potensiTembus || {},
    breakdownRealisasiMap: breakdownRealisasiMonth
  });
});

app.post("/api/saveRealisasiPotensiYL", async (req, res) => {
  const data = req.body;
  const db = loadData();
  
  if (!db.transactions) db.transactions = [];
  
  const idx = db.transactions.findIndex((t: any) => t.tanggal === data.tanggal && t.nama === data.nama);
  
  const updates = {
    rmh_yo: data.sektor?.rmh?.yo || 0, rmh_om: data.sektor?.rmh?.om || 0, rmh_os: data.sektor?.rmh?.os || 0, rmh_yt: data.sektor?.rmh?.yt || 0,
    psr_yo: data.sektor?.psr?.yo || 0, psr_om: data.sektor?.psr?.om || 0, psr_os: data.sektor?.psr?.os || 0, psr_yt: data.sektor?.psr?.yt || 0,
    skh_yo: data.sektor?.skh?.yo || 0, skh_om: data.sektor?.skh?.om || 0, skh_os: data.sektor?.skh?.os || 0, skh_yt: data.sektor?.skh?.yt || 0,
    ktr_yo: data.sektor?.ktr?.yo || 0, ktr_om: data.sektor?.ktr?.om || 0, ktr_os: data.sektor?.ktr?.os || 0, ktr_yt: data.sektor?.ktr?.yt || 0,
    tk_yo: data.sektor?.tk?.yo || 0, tk_om: data.sektor?.tk?.om || 0, tk_os: data.sektor?.tk?.os || 0, tk_yt: data.sektor?.tk?.yt || 0,
    ib_yo: data.sektor?.ib?.yo || 0, ib_om: data.sektor?.ib?.om || 0, ib_os: data.sektor?.ib?.os || 0, ib_yt: data.sektor?.ib?.yt || 0,
    bb_yo: data.bb_yo || 0, bb_om: data.bb_om || 0, bb_os: data.bb_os || 0, bb_yt: data.bb_yt || 0,
    pb_p: data.pb_p || 0, pb_s: data.pb_s || 0,
    apk_plg: data.apk_plg || 0, apk_botol: data.apk_botol || 0,
    f_plg: data.f_plg || 0, f_rk: data.f_rk || 0, f_ra: data.f_ra || 0, f_rb: data.f_rb || 0
  };

  if (idx !== -1) {
    db.transactions[idx] = { ...db.transactions[idx], ...updates };
  } else {
    // If not exists, insert it with base fields 0 so it doesn't break dashboard
    db.transactions.push({
      tanggal: data.tanggal,
      nama: data.nama,
      tot_yo: 0, tot_om: 0, tot_os: 0, tot_yt: 0,
      ...updates
    });
  }
  
  saveData(db);
  res.json({ ok: true });
});

app.post("/api/savePotensiTembus", async (req, res) => {
  const data = req.body;
  const db = loadData();
  
  if (!db.potensiTembus) db.potensiTembus = {};
  if (!db.potensiTembus[data.bulan]) db.potensiTembus[data.bulan] = {};
  
  db.potensiTembus[data.bulan][data.nama] = {
    skhTotal: data.skhTotal || 0, skhTembus: data.skhTembus || 0,
    kntrTotal: data.kntrTotal || 0, kntrTembus: data.kntrTembus || 0,
    tkoTotal: data.tkoTotal || 0, tkoTembus: data.tkoTembus || 0
  };
  
  saveData(db);
  res.json({ ok: true });
});

app.get("/api/getPotensiTembus", async (req, res) => {
  const { bulan, nama } = req.query;
  const db = loadData();
  
  if (db.potensiTembus) {
    const monthData = db.potensiTembus[bulan as string] || db.potensiTembus[Object.keys(db.potensiTembus).sort().pop() || ""];
    if (monthData) {
      if (monthData[nama as string]) {
        return res.json({ data: monthData[nama as string] });
      }
      const cleanReq = ((nama as string) || "").replace(/^\d+\s+/, "").trim().toLowerCase();
      const matchKey = Object.keys(monthData).find(k => k.replace(/^\d+\s+/, "").trim().toLowerCase() === cleanReq);
      if (matchKey && monthData[matchKey]) {
        return res.json({ data: monthData[matchKey] });
      }
    }
  }
  res.json({ data: null });
});


app.get("/api/exportRealisasi", async (req, res) => {
  try {
    const XLSX = await import("xlsx");
    const db = loadData();
    const wb = XLSX.utils.book_new();

    // 1. Sheet "Realisasi Harian"
    const txs = db.transactions || [];
    const sheet1Data = txs.map((t: any) => ({
      "Tanggal": t.tanggal,
      "Area": t.area || "",
      "Nama": t.nama || "",
      "Rmh YO": t.rmh_yo || 0, "Rmh OM": t.rmh_om || 0, "Rmh OS": t.rmh_os || 0, "Rmh YT": t.rmh_yt || 0,
      "Psr YO": t.psr_yo || 0, "Psr OM": t.psr_om || 0, "Psr OS": t.psr_os || 0, "Psr YT": t.psr_yt || 0,
      "Skh YO": t.skh_yo || 0, "Skh OM": t.skh_om || 0, "Skh OS": t.skh_os || 0, "Skh YT": t.skh_yt || 0,
      "Ktr YO": t.ktr_yo || 0, "Ktr OM": t.ktr_om || 0, "Ktr OS": t.ktr_os || 0, "Ktr YT": t.ktr_yt || 0,
      "Tk YO": t.tk_yo || 0, "Tk OM": t.tk_om || 0, "Tk OS": t.tk_os || 0, "Tk YT": t.tk_yt || 0,
      "Ib YO": t.ib_yo || 0, "Ib OM": t.ib_om || 0, "Ib OS": t.ib_os || 0, "Ib YT": t.ib_yt || 0,
      "BB YO": t.bb_yo || 0, "BB OM": t.bb_om || 0, "BB OS": t.bb_os || 0, "BB YT": t.bb_yt || 0,
      "PB Pagi": t.pb_p || 0,
      "PB Sore": t.pb_s || 0,
      "Plg APK": t.apk_plg || 0,
      "Sampah Botol": t.apk_botol || 0,
      "F. Plg": t.f_plg || 0,
      "F. RK": t.f_rk || 0,
      "F. RA": t.f_ra || 0,
      "F. RB": t.f_rb || 0
    }));
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, ws1, "Realisasi Harian");

    // 2. Sheet "Laporan DP1"
    
    // Get breakdownRealisasi for latest month to get pembagi realisasi
    let latestBRMonth = "";
    if (db.breakdownRealisasi) {
      const brMonths = Object.keys(db.breakdownRealisasi).sort();
      if (brMonths.length > 0) {
        latestBRMonth = brMonths[brMonths.length - 1];
      }
    }
    const breakdownRealisasi = latestBRMonth ? db.breakdownRealisasi[latestBRMonth] : {};
    
    let realisasiPembagi = "";
    const brKeys = Object.keys(breakdownRealisasi);
    if (brKeys.length > 0) {
      realisasiPembagi = breakdownRealisasi[brKeys[0]]?.pembagiTanggal || "";
    }

    const aoa: any[][] = [];
    aoa.push(["Pembagi", realisasiPembagi]);
    aoa.push([]);
    aoa.push([]);
    aoa.push([]);

    const uniqueYLs = new Map();
    if (db.ylList) {
      db.ylList.forEach((y: any) => {
        if (y.status !== "Resign") {
          uniqueYLs.set(y.nama, { area: y.area, nama: y.nama });
        }
      });
    }
    txs.forEach((t: any) => {
      if (t.nama && !uniqueYLs.has(t.nama)) {
        uniqueYLs.set(t.nama, { area: t.area || "", nama: t.nama });
      }
    });

    const yls = Array.from(uniqueYLs.values()).sort((a: any, b: any) => String(a.area).localeCompare(String(b.area)));

    const ylData = yls.map(yl => {
      const myTxs = txs.filter((t: any) => t.nama === yl.nama);
      const data = {
        rmh_yo: 0, rmh_om: 0, rmh_os: 0, rmh_yt: 0,
        psr_yo: 0, psr_om: 0, psr_os: 0, psr_yt: 0,
        skh_yo: 0, skh_om: 0, skh_os: 0, skh_yt: 0,
        ktr_yo: 0, ktr_om: 0, ktr_os: 0, ktr_yt: 0,
        tk_yo: 0, tk_om: 0, tk_os: 0, tk_yt: 0,
        ib_yo: 0, ib_om: 0, ib_os: 0, ib_yt: 0,
        f_plg: 0, f_rb: 0, pb: 0
      };
      myTxs.forEach((t: any) => {
        data.rmh_yo += Number(t.rmh_yo) || 0; data.rmh_om += Number(t.rmh_om) || 0; data.rmh_os += Number(t.rmh_os) || 0; data.rmh_yt += Number(t.rmh_yt) || 0;
        data.psr_yo += Number(t.psr_yo) || 0; data.psr_om += Number(t.psr_om) || 0; data.psr_os += Number(t.psr_os) || 0; data.psr_yt += Number(t.psr_yt) || 0;
        data.skh_yo += Number(t.skh_yo) || 0; data.skh_om += Number(t.skh_om) || 0; data.skh_os += Number(t.skh_os) || 0; data.skh_yt += Number(t.skh_yt) || 0;
        data.ktr_yo += Number(t.ktr_yo) || 0; data.ktr_om += Number(t.ktr_om) || 0; data.ktr_os += Number(t.ktr_os) || 0; data.ktr_yt += Number(t.ktr_yt) || 0;
        data.tk_yo += Number(t.tk_yo) || 0; data.tk_om += Number(t.tk_om) || 0; data.tk_os += Number(t.tk_os) || 0; data.tk_yt += Number(t.tk_yt) || 0;
        data.ib_yo += Number(t.ib_yo) || 0; data.ib_om += Number(t.ib_om) || 0; data.ib_os += Number(t.ib_os) || 0; data.ib_yt += Number(t.ib_yt) || 0;
        data.f_plg += Number(t.f_plg) || 0;
        data.f_rb += Number(t.f_rb) || 0;
        data.pb += (Number(t.pb_p) || 0) + (Number(t.pb_s) || 0);
      });

      let skhT = 0, skhTm = 0, ktrT = 0, ktrTm = 0, tkoT = 0, tkoTm = 0;
      if (db.potensiTembus) {
        const months = Object.keys(db.potensiTembus).sort();
        if (months.length > 0) {
          const latestMonth = months[months.length - 1];
          const monthData = db.potensiTembus[latestMonth] || {};
          const cleanReq = (yl.nama || "").replace(/^\d+\s+/, "").trim().toLowerCase();
          const matchKey = Object.keys(monthData).find(k => k.replace(/^\d+\s+/, "").trim().toLowerCase() === cleanReq);
          const p = monthData[yl.nama] || (matchKey ? monthData[matchKey] : null);
          if (p) {
            skhT = Number(p.skhTotal) || 0; skhTm = Number(p.skhTembus) || 0;
            ktrT = Number(p.kntrTotal) || 0; ktrTm = Number(p.kntrTembus) || 0;
            tkoT = Number(p.tkoTotal) || 0; tkoTm = Number(p.tkoTembus) || 0;
          } else if (db.plgPjlManual?.[yl.nama]) {
            const plg = db.plgPjlManual[yl.nama];
            skhT = Number(plg.skhTgt) || 0; ktrT = Number(plg.kntrTgt) || 0; tkoT = Number(plg.tkTgt) || 0;
          }
        }
      } else if (db.plgPjlManual?.[yl.nama]) {
        const plg = db.plgPjlManual[yl.nama];
        skhT = Number(plg.skhTgt) || 0; ktrT = Number(plg.kntrTgt) || 0; tkoT = Number(plg.tkTgt) || 0;
      }
      
      const areaCode = String(yl.area).substring(0, 3);
      const pembagiArea = breakdownRealisasi[areaCode]?.pembagiTanggal || realisasiPembagi || 1; // avoid divide by 0 if possible

      return { yl, data, potensi: { skhT, skhTm, ktrT, ktrTm, tkoT, tkoTm }, pembagi: Number(pembagiArea) };
    });

    const buildBlock = (ylItem: any) => {
      const b: any[][] = [];
      b.push([ `${ylItem.yl.area}   ${ylItem.yl.nama}`, "AKM", "", "RATA RATA", "", "PERSEN", "" ]);
      const d = ylItem.data;
      const sectors = [
        { label: "RUMAH", keys: ["rmh_yo", "rmh_om", "rmh_os", "rmh_yt"] as const },
        { label: "PASAR", keys: ["psr_yo", "psr_om", "psr_os", "psr_yt"] as const },
        { label: "SEKOLAH", keys: ["skh_yo", "skh_om", "skh_os", "skh_yt"] as const },
        { label: "KANTOR", keys: ["ktr_yo", "ktr_om", "ktr_os", "ktr_yt"] as const },
        { label: "TOKO", keys: ["tk_yo", "tk_om", "tk_os", "tk_yt"] as const },
        { label: "IB", keys: ["ib_yo", "ib_om", "ib_os", "ib_yt"] as const }
      ];

      const totProd = {
        yo: sectors.reduce((sum, s) => sum + (d[s.keys[0]] || 0), 0),
        om: sectors.reduce((sum, s) => sum + (d[s.keys[1]] || 0), 0),
        os: sectors.reduce((sum, s) => sum + (d[s.keys[2]] || 0), 0),
        yt: sectors.reduce((sum, s) => sum + (d[s.keys[3]] || 0), 0),
      };
      const grandTotal = totProd.yo + totProd.om + totProd.os + totProd.yt;
      const fmtP = (num: number, den: number) => den ? `${((num/den)*100).toFixed(2).replace('.',',')}%` : "0,00%";
      const fmtN = (num: number) => num ? Number(num.toFixed(2)) : 0;
      const pembagi = ylItem.pembagi > 0 ? ylItem.pembagi : 1;

      sectors.forEach(sec => {
        const sYo = d[sec.keys[0]] || 0, sOm = d[sec.keys[1]] || 0, sOs = d[sec.keys[2]] || 0, sYt = d[sec.keys[3]] || 0;
        const subTotal = sYo + sOm + sOs + sYt;
        
        b.push([ `${sec.label} YO`, sYo || 0, "", fmtN(sYo/pembagi), "", fmtP(sYo, totProd.yo), "" ]);
        b.push([ `${sec.label} OM`, sOm || 0, "", fmtN(sOm/pembagi), "", fmtP(sOm, totProd.om), "" ]);
        b.push([ `${sec.label} OS`, sOs || 0, "", fmtN(sOs/pembagi), "", fmtP(sOs, totProd.os), "" ]);
        b.push([ `${sec.label} YT`, sYt || 0, subTotal || 0, fmtN(sYt/pembagi), fmtN(subTotal/pembagi), fmtP(sYt, totProd.yt), fmtP(subTotal, grandTotal) ]);
      });

      b.push([ "", totProd.yo || 0, "", fmtN(totProd.yo/pembagi), "", fmtP(totProd.yo, totProd.yo), "" ]);
      b.push([ "", totProd.om || 0, "", fmtN(totProd.om/pembagi), "", fmtP(totProd.om, totProd.om), "" ]);
      b.push([ "", totProd.os || 0, "", fmtN(totProd.os/pembagi), "", fmtP(totProd.os, totProd.os), "" ]);
      b.push([ "total", totProd.yt || 0, grandTotal || 0, fmtN(totProd.yt/pembagi), fmtN(grandTotal/pembagi), fmtP(totProd.yt, totProd.yt), fmtP(grandTotal, grandTotal) ]);

      b.push([ "JLM PLG", d.f_plg || 0, "", "", "", "", "" ]);
      b.push([ "PLG RUTIN", "", "0,00%", "", "", "", "" ]);
      b.push([ "RB", d.f_rb || 0, "", "", "", "", "" ]);
      b.push([ "PB", d.pb || 0, "", "", "", "", "" ]);
      b.push([ "TTL SKLH/TMBS", `${ylItem.potensi.skhT}/${ylItem.potensi.skhTm}`, "", "", "", "", "" ]);
      b.push([ "TTL KNTR/TMBS", `${ylItem.potensi.ktrT}/${ylItem.potensi.ktrTm}`, "", "", "", "", "" ]);
      b.push([ "TTL TKO/TMBS", `${ylItem.potensi.tkoT}/${ylItem.potensi.tkoTm}`, "", "", "", "", "" ]);

      return b;
    };

    for (let i = 0; i < ylData.length; i += 2) {
      const block1 = buildBlock(ylData[i]);
      const block2 = (i + 1 < ylData.length) ? buildBlock(ylData[i+1]) : null;

      for (let r = 0; r < 35; r++) {
        const row = [""]; // Col A
        if (block1 && block1[r]) {
          row.push(...block1[r]);
        } else {
          row.push("", "", "", "", "", "", "");
        }
        row.push(""); // Col I

        if (block2 && block2[r]) {
          row.push(...block2[r]);
        } else {
          row.push("", "", "", "", "", "", "");
        }
        aoa.push(row);
      }
      aoa.push([]);
      aoa.push([]);
    }

    const ws2 = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws2, "Laporan DP1");

    // Send file
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error: any) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

app.post("/api/savePlgPjlManual", async (req, res) => {
  const { area, sklh_total, sklh_tembus, kntr_total, kntr_tembus, tko_total, tko_tembus } = req.body;
  if (!area) return res.status(400).json({ ok: false, error: "Area wajib diisi" });

  const db = loadData();
  if (!db.plgPjlManual) db.plgPjlManual = {};

  db.plgPjlManual[area] = {
    sklh_total: Number(sklh_total || 0),
    sklh_tembus: Number(sklh_tembus || 0),
    kntr_total: Number(kntr_total || 0),
    kntr_tembus: Number(kntr_tembus || 0),
    tko_total: Number(tko_total || 0),
    tko_tembus: Number(tko_tembus || 0)
  };

  saveData(db);
  res.json({ ok: true, plgPjlManual: db.plgPjlManual });
});

// 7. General DP1 Target loading
app.get("/api/getTarget", async (req, res) => {
  const db = loadData();
  const perArea: any = {};
  const total = {
    target: { YO: 0, OM: 0, OS: 0, YT: 0, ALL: 0 },
    bulanLalu: { YO: 0, OM: 0, OS: 0, YT: 0, ALL: 0 },
    tahunLalu: { YO: 0, OM: 0, OS: 0, YT: 0, ALL: 0 }
  };

  const ylList = db.ylList || INITIAL_YL_LIST;
  const names = Object.values(db.ylPins || INITIAL_DATA.ylPins) as string[];
  names.forEach(name => {
    const ylItem = ylList.find((y: any) => y.nama === name);
    const area = ylItem ? ylItem.area : name.substring(0, 3);
    const tgtObj = db.targetYL[`${area}_2026-07`] || db.targetYL[area] || { target: 0, bln_lalu: 0, thn_lalu: 0, e6: 0 };
    perArea[area] = {
      target: { YO: Math.floor(tgtObj.target * 0.9), OM: Math.floor(tgtObj.target * 0.05), OS: Math.floor(tgtObj.target * 0.03), YT: Math.floor(tgtObj.target * 0.02), ALL: tgtObj.target },
      bulanLalu: { YO: Math.floor(tgtObj.bln_lalu * 0.9), OM: Math.floor(tgtObj.bln_lalu * 0.05), OS: Math.floor(tgtObj.bln_lalu * 0.03), YT: Math.floor(tgtObj.bln_lalu * 0.02), ALL: tgtObj.bln_lalu },
      tahunLalu: { YO: Math.floor(tgtObj.thn_lalu * 0.9), OM: Math.floor(tgtObj.thn_lalu * 0.05), OS: Math.floor(tgtObj.thn_lalu * 0.03), YT: Math.floor(tgtObj.thn_lalu * 0.02), ALL: tgtObj.thn_lalu }
    };
  });

  Object.values(perArea).forEach((a: any) => {
    ['target', 'bulanLalu', 'tahunLalu'].forEach(k => {
      ['YO', 'OM', 'OS', 'YT', 'ALL'].forEach(p => {
        (total as any)[k][p] += a[k][p];
      });
    });
  });

  res.json({ perArea, total });
});

// 8. General Dashboard DP1 (Main statistics card source)
app.get("/api/getDashboardDP1", async (req, res) => {
  const db = loadData();
  res.json(getCachedDashboardDP1(db));
});

// 9. Gemini AI Evaluation - Deeper, structured and highly Jember 1 specific
app.post("/api/gemini/evaluate", async (req, res) => {
  const { data } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      insight: "<b>Mode Demo:</b> Kunci API Gemini tidak terkonfigurasi di server. Silakan hubungi admin untuk menyetel GEMINI_API_KEY di panel Secrets agar mendapatkan analisis berbasis AI yang mendalam."
    });
  }

  const prompt = `
Anda adalah konsultan bisnis senior khusus manajemen sales Yakult Lady (YL) Unit DP Jember 1.
Berikut adalah data kinerja harian tim YL saat ini:
${JSON.stringify(data, null, 2)}

Berdasarkan data di atas, tolong berikan analisis performa yang SANGAT mendalam, komprehensif, dan taktis dalam Bahasa Indonesia. Format dalam HTML bersih (gunakan tag seperti <p>, <b>, <ul>, <li>, <strong>, dll) dengan struktur sebagai berikut:

1. <b>🚨 HIGHLIGHT OPERASIONAL UTAMA:</b> Ringkasan singkat performa tim hari ini, termasuk pencapaian target kumulatif dan metrik penting lainnya.
2. <b>🏆 ANALISIS PERFORMA TERBAIK (SQUAD JUARA):</b> YL dengan kinerja terbaik dari segi penjualan, pertumbuhan, propaganda, atau rasio kunjungan. Berikan apresiasi spesifik.
3. <b>⚠️ AREA PERBAIKAN & NEGATIF HIGHLIGHTS:</b> Identifikasi YL yang memerlukan perhatian khusus (misalnya tingkat Balik Botol / BB yang tinggi, atau rasio kunjungan yang rendah). Berikan saran taktis perbaikan rute.
4. <b>💡 REKOMENDASI STRATEGIS & RENCANA AKSI:</b> Rekomendasi konkret untuk Manager DP Jember 1 guna meningkatkan efisiensi operasional tim di lapangan esok hari.
`;

  try {
    const text = await generateGeminiWithRetry({
      contents: prompt,
      temperature: 0.7
    });
    res.json({ insight: text || "Tidak ada analisis yang dihasilkan." });
  } catch (e: any) {
    console.error("Gemini Error:", e);
    res.json({ insight: `<b>Gagal memuat analisis AI:</b> ${e.message || "Terjadi kesalahan."}` });
  }
});

// 9b. Gemini AI Evaluation for specific Yakult Lady (Ibu-ibu Style)
app.post("/api/gemini/evaluate-yl", async (req, res) => {
  const { area, data } = req.body;
  const ylNama = data.nama || area;
  const avgSales = Math.trunc(data.rata2 || 0);
  const targetVal = data.targetYL || 0;
  const bbVal = data.bbYL || 0;

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      insight: `<p class="mb-3"><b>Assalamu'alaikum Ibu ${ylNama} sayang! ❤️</b></p>
<p class="mb-3">Alhamdulillah, capaian rata-rata harian Ibu bulan ini tercatat <b>${avgSales} botol/hari</b> dari target harian <b>${targetVal} botol</b>, dengan Balik Botol <b>${bbVal} botol</b>.</p>
<p class="mb-3">Ibu tahu betapa kerasnya perjuangan Ibu di rute harian. Jaga selalu kesehatan dan senyuman ramah untuk para pelanggan nggih Bu! 🌸</p>
<p><b>Pesan Hari Ini:</b> Fokus sapa pelanggan setia dan rapikan stok harian agar makin lancar. Semangat selalu Ibu sayang! ✨</p>`
    });
  }

  const prompt = `Anda adalah "Ibu AI", pendamping & supervisor senior yang sangat ramah, hangat, penuh perhatian, dan keibuan untuk Yakult Lady DP Jember 1.
Berikan analisis dan motivasi SINGKAT, PADAT, dan SIMPEL untuk Ibu ${ylNama} (Area ${area}) berdasarkan data bulan ini:

Data Kinerja:
- Nama: ${ylNama}
- Akumulasi Penjualan: ${data.akumulasi || 0} botol
- Rata-Rata Harian: ${avgSales} botol/hari (Target harian: ${targetVal} botol)
- Capaian vs Target: ${Math.trunc(((data.rata2 || 0) / (data.targetYL || 1)) * 100)}%
- Total Balik Botol (BB): ${bbVal} botol
- Total Propaganda Baru (PB): ${data.totalPb || 0} PB (${data.pbPersen || 0}%)

ATURAN PENTING:
1. Buat kalimat yang SANGAT SIMPEL, SINGKAT, dan LANGSUNG KE INTI (Maksimal 3-4 paragraf pendek/poin).
2. Gunakan gaya bahasa keibuan yang sangat hangat, manis, dan menyemangati (seperti: "Ibu ${ylNama} sayang", "Ibu tahu betapa hebatnya Ibu", "Tetap semangat nggih Bu").
3. Jangan pakai istilah teknis yang rumit. Gunakan bahasa sehari-hari yang sangat mudah dipahami ibu-ibu Yakult Lady yang sudah sepuh/tua.
4. Format dalam HTML bersih (<p>, <b>, <ul>, <li>) dengan emoji yang hangat.`;

  try {
    const text = await generateGeminiWithRetry({
      contents: prompt,
      temperature: 0.7
    });
    res.json({ insight: text || "Tidak ada analisis yang dihasilkan." });
  } catch (e: any) {
    console.error("Gemini YL Error:", e);
    res.json({
      insight: `<p class="mb-2"><b>Assalamu'alaikum Ibu ${ylNama} sayang! ❤️</b></p>
<p class="mb-2">Capaian rata-rata harian Ibu saat ini <b>${avgSales} botol/hari</b> (Target: <b>${targetVal} botol</b>) dan Balik Botol <b>${bbVal} botol</b>.</p>
<p>Tetap semangat nggih Bu! Jaga kesehatan di rute jalan harian Ibu. Ibu pasti bisa! 🌸✨</p>`
    });
  }
});

// 10. Reset Data to defaults
app.post("/api/resetData", (req, res) => {
  try {
    if (writeTimeout) { clearTimeout(writeTimeout); writeTimeout = null; }
    safeWriteFile(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    cachedDb = JSON.parse(JSON.stringify(INITIAL_DATA));
    dashboardDP1Cache = null;
    dashboardCacheDirty = true;
    res.json({ ok: true });
  } catch (err: any) {
    console.error("Error resetting data:", err);
    res.status(500).json({ error: "Gagal mengembalikan data ke semula." });
  }
});

// Reset Data Khusus (4 Kategori)
app.post("/api/resetDataTargeted", (req, res) => {
  try {
    const { scope, currentMonth } = req.body;
    const db = loadData();
    const activeMonth = currentMonth || new Date().toISOString().substring(0, 7);

    if (scope === "all") {
      db.plgPjlManual = {};
      db.potensiTembus = {};
      db.transactions = [];
      db.breakdownRealisasi = {};
      db.breakdownPlan = {};
      db.lhppRealisasi = {};
      db.targetTKU = { target: 0, bln_lalu: 0, thn_lalu: 0, target_yo: 0, target_om: 0, target_os: 0, target_yt: 0, bln_lalu_yo: 0, bln_lalu_om: 0, bln_lalu_os: 0, bln_lalu_yt: 0, thn_lalu_yo: 0, thn_lalu_om: 0, thn_lalu_os: 0, thn_lalu_yt: 0 };
      db.targetYL = {};
      if (db.settingTargets) db.settingTargets = {};
    } else if (scope === "current_month" && activeMonth) {
      if (db.plgPjlManual) delete db.plgPjlManual[activeMonth];
      if (db.potensiTembus) delete db.potensiTembus[activeMonth];
      if (db.transactions) {
        db.transactions = db.transactions.filter((t: any) => !(t.tanggal && t.tanggal.startsWith(activeMonth)));
      }
      if (db.breakdownRealisasi) delete db.breakdownRealisasi[activeMonth];
      if (db.breakdownPlan) delete db.breakdownPlan[activeMonth];
      if (db.lhppRealisasi) {
        Object.keys(db.lhppRealisasi).forEach(date => {
          if (date.startsWith(activeMonth)) delete db.lhppRealisasi[date];
        });
      }
      db.targetTKU = { target: 0, bln_lalu: 0, thn_lalu: 0, target_yo: 0, target_om: 0, target_os: 0, target_yt: 0, bln_lalu_yo: 0, bln_lalu_om: 0, bln_lalu_os: 0, bln_lalu_yt: 0, thn_lalu_yo: 0, thn_lalu_om: 0, thn_lalu_os: 0, thn_lalu_yt: 0 };
      if (db.targetYL) {
        Object.keys(db.targetYL).forEach(key => {
          if (key.endsWith(activeMonth) || key.includes(activeMonth)) delete db.targetYL[key];
        });
      }
      if (db.settingTargets) delete db.settingTargets[activeMonth];
    } else {
      return res.status(400).json({ error: "Parameter tidak valid." });
    }

    saveData(db);
    return res.json({ ok: true, message: `Data PLG & PJL, Input PJL, BD & Realisasi, dan Target (${scope === "all" ? "SEMUA RIWAYAT" : "BULAN " + activeMonth}) berhasil dihapus.` });
  } catch (err: any) {
    console.error("Error in resetDataTargeted:", err);
    return res.status(500).json({ error: "Gagal menghapus data: " + err.message });
  }
});

// API 404 Fallback - Ensure non-existent /api routes return JSON, not HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found` });
});

// Express Global Error Handler for /api routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Server Error:", err);
  if (req.path.startsWith("/api")) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
  next(err);
});

// VITE MIDDLEWARE FOR DEVELOPMENT / STATIC SERVING FOR PRODUCTION
async function startServer() {
  // Ensure data store is initialized on boot
  loadData();

  const distPath = path.join(process.cwd(), "dist");
  const distIndexHtml = path.join(distPath, "index.html");
  const hasProdBuild = fs.existsSync(distIndexHtml);

  // Prefer the built (fast, minified, no-HMR) version whenever it exists.
  // Relying on NODE_ENV alone is fragile: if `npm start` is ever launched
  // without that variable set (Termux, PM2, a plain `node dist/server.cjs`),
  // this used to silently fall back to the heavy Vite dev server — the
  // exact cause of the app feeling slow on entry-level phones even after
  // a production build had been made.
  const useProdStaticServing = process.env.NODE_ENV === "production" || hasProdBuild;

  if (!useProdStaticServing) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(distIndexHtml);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app, loadData };

if (!process.env.NETLIFY) {
  startServer();
}
