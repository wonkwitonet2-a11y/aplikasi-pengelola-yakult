import type { DashboardData, EvaluasiData } from "../types";
import { INITIAL_YL_LIST, getStoredYlList } from "./storage";

export function getFallbackDashboardData(): DashboardData {
  const ylList = getStoredYlList() || INITIAL_YL_LIST;
  const perYL: Record<string, any> = {};

  ylList.forEach(y => {
    perYL[y.area] = {
      nama: y.nama,
      akumulasi: 0,
      rata2: 0,
      hariAktif: 15,
      targetYL: 0,
      bulanLaluYL: 0,
      tahunLaluYL: 0,
      bbYL: 0,
      yo: 0,
      om: 0,
      os: 0,
      yt: 0,
      pembagi: 15
    };
  });

  return {
    totalPenjualan: 0,
    rataHarian: 0,
    salesPerYl: 0,
    jwp: 0,
    rataItem: { YO: 0, OM: 0, OS: 0, YT: 0 },
    vsTarget: 0,
    vsBulanLalu: 0,
    vsTahunLalu: 0,
    targetTim: { target: 0, bulanLalu: 0, tahunLalu: 0, rata2: 0 },
    bbTimRaw: 0,
    hariAktif: 15,
    perYL,
    grafikHarian: {
      tanggal: ["01", "02", "03", "04", "05"],
      penjualan: [0, 0, 0, 0, 0],
      balikBotol: [0, 0, 0, 0, 0]
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

export function getFallbackEvaluasiData(): EvaluasiData {
  const ylList = getStoredYlList() || INITIAL_YL_LIST;
  const dataRows = ylList.map(y => {
    return [
      y.area, // 0
      y.nama, // 1
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];
  });

  const totalRow = [
    "TOTAL", "",
    ...Array(30).fill(0)
  ];

  const analisis = ylList.map(y => ({
    area: y.area,
    nama: y.nama,
    jualHariIni: 0,
    rata2BulanBerjalan: 0,
    vsMingguLaluPct: 0,
    persenRumah: 0,
    persenRbVsPlg: 0,
    propagandaHariIni: 0,
    sampahBotol: 0,
    bb: 0,
    propagandaVs900: null
  }));

  return {
    headerRows: [],
    dataRows,
    totalRow,
    analisis
  };
}
