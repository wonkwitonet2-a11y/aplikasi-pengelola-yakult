import type { DashboardData, EvaluasiData } from "../types";
import { INITIAL_YL_LIST, getStoredYlList } from "./storage";

export function getStoredBreakdownRealisasi(month: string = "2026-07") {
  try {
    const raw = localStorage.getItem(`bd_realisasi_${month}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.warn("Failed to read local bd_realisasi:", e);
  }
  return {};
}

export function getStoredBreakdownPlan(month: string = "2026-07") {
  try {
    const raw = localStorage.getItem(`bd_plan_${month}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.warn("Failed to read local bd_plan:", e);
  }
  return {};
}

export function getFallbackDashboardData(month: string = "2026-07"): DashboardData {
  const ylList = getStoredYlList() || INITIAL_YL_LIST;
  const realMap = getStoredBreakdownRealisasi(month);

  const perYL: Record<string, any> = {};
  let grandTotal = 0;
  let totalYo = 0, totalOm = 0, totalOs = 0, totalYt = 0;
  let teamTotalRata2 = 0;
  let totalPembagi = 0;

  const dailySalesMap: Record<number, number> = {};

  ylList.forEach(y => {
    const area = y.area;
    let areaData = realMap[area];
    if (!areaData) {
      const foundKey = Object.keys(realMap).find(k => k === area || k.startsWith(area) || area.startsWith(k) || k.includes(y.nama));
      if (foundKey) areaData = realMap[foundKey];
    }

    const days = areaData && areaData.days ? areaData.days : (areaData || {});
    const pembagi = (areaData && Number(areaData.pembagiTanggal) > 0) ? Number(areaData.pembagiTanggal) : 15;

    let ylYo = 0, ylOm = 0, ylOs = 0, ylYt = 0;
    if (days && typeof days === "object") {
      Object.entries(days).forEach(([dayStr, d]: [string, any]) => {
        if (!d) return;
        const dNum = parseInt(dayStr, 10);
        const yoVal = Number(d.yo) || 0;
        const omVal = Number(d.om) || 0;
        const osVal = Number(d.os) || 0;
        const ytVal = Number(d.yt) || 0;

        ylYo += yoVal;
        ylOm += omVal;
        ylOs += osVal;
        ylYt += ytVal;

        if (!isNaN(dNum)) {
          dailySalesMap[dNum] = (dailySalesMap[dNum] || 0) + (yoVal + omVal + osVal + ytVal);
        }
      });
    }

    const ylTotal = ylYo + ylOm + ylOs + ylYt;
    const ylRata2 = pembagi > 0 ? ylTotal / pembagi : 0;

    grandTotal += ylTotal;
    totalYo += ylYo;
    totalOm += ylOm;
    totalOs += ylOs;
    totalYt += ylYt;
    teamTotalRata2 += ylRata2;
    totalPembagi += pembagi;

    perYL[area] = {
      nama: y.nama,
      akumulasi: ylTotal,
      rata2: Math.round(ylRata2),
      hariAktif: pembagi,
      pembagi,
      targetYL: (y as any).target || 0,
      bulanLaluYL: (y as any).bln_lalu || 0,
      tahunLaluYL: (y as any).thn_lalu || 0,
      bbYL: 0,
      yo: ylYo,
      om: ylOm,
      os: ylOs,
      yt: ylYt
    };
  });

  const countYl = ylList.length || 1;
  const salesPerYl = countYl > 0 ? grandTotal / countYl : 0;
  const avgPembagi = countYl > 0 ? Math.round(totalPembagi / countYl) : 15;

  const datesList = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const salesList = datesList.map((_, i) => dailySalesMap[i + 1] || 0);

  return {
    totalPenjualan: grandTotal,
    rataHarian: Math.round(teamTotalRata2),
    salesPerYl: Math.round(salesPerYl),
    jwp: 0,
    rataItem: {
      YO: avgPembagi > 0 ? Math.round(totalYo / avgPembagi) : 0,
      OM: avgPembagi > 0 ? Math.round(totalOm / avgPembagi) : 0,
      OS: avgPembagi > 0 ? Math.round(totalOs / avgPembagi) : 0,
      YT: avgPembagi > 0 ? Math.round(totalYt / avgPembagi) : 0
    },
    vsTarget: 0,
    vsBulanLalu: 0,
    vsTahunLalu: 0,
    targetTim: { target: 0, bulanLalu: 0, tahunLalu: 0, rata2: Math.round(teamTotalRata2) },
    bbTimRaw: 0,
    hariAktif: avgPembagi,
    perYL,
    grafikHarian: {
      tanggal: datesList,
      penjualan: salesList,
      balikBotol: Array(31).fill(0)
    },
    sektorTim: {
      rumah: 0,
      pasar: 0,
      sekolah: 0,
      kantor: 0,
      toko: 0,
      ib: 0
    }
  };
}

export function getFallbackEvaluasiData(month: string = "2026-07"): EvaluasiData {
  const ylList = getStoredYlList() || INITIAL_YL_LIST;
  const realMap = getStoredBreakdownRealisasi(month);

  const dataRows = ylList.map(y => {
    const area = y.area;
    let areaData = realMap[area];
    if (!areaData) {
      const foundKey = Object.keys(realMap).find(k => k === area || k.startsWith(area) || area.startsWith(k) || k.includes(y.nama));
      if (foundKey) areaData = realMap[foundKey];
    }

    const days = areaData && areaData.days ? areaData.days : (areaData || {});
    const pembagi = (areaData && Number(areaData.pembagiTanggal) > 0) ? Number(areaData.pembagiTanggal) : 15;

    let ylYo = 0, ylOm = 0, ylOs = 0, ylYt = 0;
    let todayYo = 0, todayOm = 0, todayOs = 0, todayYt = 0;

    if (days && typeof days === "object") {
      Object.entries(days).forEach(([dayStr, d]: [string, any]) => {
        if (!d) return;
        const dNum = parseInt(dayStr, 10);
        const yoVal = Number(d.yo) || 0;
        const omVal = Number(d.om) || 0;
        const osVal = Number(d.os) || 0;
        const ytVal = Number(d.yt) || 0;

        ylYo += yoVal;
        ylOm += omVal;
        ylOs += osVal;
        ylYt += ytVal;

        if (dNum === pembagi) {
          todayYo = yoVal;
          todayOm = omVal;
          todayOs = osVal;
          todayYt = ytVal;
        }
      });
    }

    const todayTotal = todayYo + todayOm + todayOs + todayYt;
    const ylTotal = ylYo + ylOm + ylOs + ylYt;
    const rata2Total = pembagi > 0 ? Math.round(ylTotal / pembagi) : 0;
    const rataYo = pembagi > 0 ? Math.round(ylYo / pembagi) : 0;
    const rataOm = pembagi > 0 ? Math.round(ylOm / pembagi) : 0;
    const rataOs = pembagi > 0 ? Math.round(ylOs / pembagi) : 0;
    const rataYt = pembagi > 0 ? Math.round(ylYt / pembagi) : 0;

    return [
      y.area,
      y.nama,
      0,
      todayYo, todayOm, todayOs, todayYt, todayTotal,
      ylTotal,
      rataYo, rataOm, rataOs, rataYt, rata2Total,
      0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0,
      0, 0, 0, 0, 0, 0, 0
    ];
  });

  let totTodayYo = 0, totTodayOm = 0, totTodayOs = 0, totTodayYt = 0, totTodayTotal = 0;
  let totAkm = 0;
  let totRataYo = 0, totRataOm = 0, totRataOs = 0, totRataYt = 0, totRataTotal = 0;

  dataRows.forEach(r => {
    totTodayYo += (r[3] as number) || 0;
    totTodayOm += (r[4] as number) || 0;
    totTodayOs += (r[5] as number) || 0;
    totTodayYt += (r[6] as number) || 0;
    totTodayTotal += (r[7] as number) || 0;
    totAkm += (r[8] as number) || 0;
    totRataYo += (r[9] as number) || 0;
    totRataOm += (r[10] as number) || 0;
    totRataOs += (r[11] as number) || 0;
    totRataYt += (r[12] as number) || 0;
    totRataTotal += (r[13] as number) || 0;
  });

  const totalRow = [
    "TOTAL", "",
    0,
    totTodayYo, totTodayOm, totTodayOs, totTodayYt, totTodayTotal,
    totAkm,
    totRataYo, totRataOm, totRataOs, totRataYt, totRataTotal,
    ...Array(18).fill(0)
  ];

  const analisis = ylList.map((y, idx) => {
    const row = dataRows[idx];
    return {
      area: y.area,
      nama: y.nama,
      jualHariIni: (row[7] as number) || 0,
      rata2BulanBerjalan: (row[13] as number) || 0,
      vsMingguLaluPct: 0,
      persenRumah: 0,
      persenRbVsPlg: 0,
      propagandaHariIni: 0,
      sampahBotol: 0,
      bb: 0,
      propagandaVs900: null
    };
  });

  return {
    headerRows: [],
    dataRows,
    totalRow,
    analisis
  };
}
