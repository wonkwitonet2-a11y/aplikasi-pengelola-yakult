import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Search, Plus, Trash2, ArrowLeft, ArrowRight, ChevronDown, ChevronRight, ClipboardCheck, Download, X } from 'lucide-react';
import { saveToSupabase, loadFromSupabase } from '../lib/supabaseClient';
import { lookupPreviousYearData, getPreviousYearDataSync } from '../lib/historicalArchiveLookup';
import { cleanYlName } from '../types';

export const SEED_DATA_2026 = {
  "tahun": 2026,
  "tku": "DP JEMBER 1",
  "cabang": "JEMBER",
  "jumlahYL": 10,
  "hariPerBulan": { "jan": 31, "feb": 28, "mar": 31, "apr": 30, "mei": 31, "jun": 30, "jul": 31, "agu": 31, "sep": 30, "okt": 31, "nov": 30, "des": 31 },
  "bulanan": {
    "jan": {
      "ratarataYO": 2852, "ratarataOM": 205, "ratarataOS": null, "ratarataYT": 153,
      "ratarataPenjualanYL": 3211,
      "targetYO": 2720, "targetOM": 265, "targetOS": null, "targetYT": 155,
      "targetRataRataPenjualan": 3140, "persenCapaian": 102.3,
      "ratarataYOTahunLalu": 3050, "ratarataOMTahunLalu": null, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 174,
      "ratarataPenjualanTahunLalu": 3224, "persenTahunLalu": 99.6,
      "akmPenjualan": 99540, "akmTarget": 97340, "akmSelisih": 2200,
      "jwp": 310, "salesPerYL": 321, "salesPerYLTahunLalu": 322, "salesSelisih": -1,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 1, "r250_279": 3, "r280_299": 1, "r300_329": 1, "r330_349": 1, "lebih350": 3, "persenYLKurang250": 10.0 },
      "absen": { "jumlahYL": 4, "frekuensi": 5, "ewpPersen": 0.0 },
      "akmPDM": 107820, "akmKembaliBotol": 8280, "persenKembaliBotol": 7.7,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3140, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "feb": {
      "ratarataYO": 2761, "ratarataOM": 205, "ratarataOS": null, "ratarataYT": 148,
      "ratarataPenjualanYL": 3115,
      "targetYO": 2760, "targetOM": 275, "targetOS": null, "targetYT": 175,
      "targetRataRataPenjualan": 3210, "persenCapaian": 97.1,
      "ratarataYOTahunLalu": 3423, "ratarataOMTahunLalu": null, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 173,
      "ratarataPenjualanTahunLalu": 3596, "persenTahunLalu": 86.6,
      "akmPenjualan": 87230, "akmTarget": 89880, "akmSelisih": -2650,
      "jwp": 280, "salesPerYL": 312, "salesPerYLTahunLalu": 359, "salesSelisih": -47,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 1, "r250_279": 3, "r280_299": 2, "r300_329": 0, "r330_349": 2, "lebih350": 2, "persenYLKurang250": 10.0 },
      "absen": { "jumlahYL": 1, "frekuensi": 3, "ewpPersen": 0.0 },
      "akmPDM": 92295, "akmKembaliBotol": 5065, "persenKembaliBotol": 5.5,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3115, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "mar": {
      "ratarataYO": 3468, "ratarataOM": 335, "ratarataOS": null, "ratarataYT": 184,
      "ratarataPenjualanYL": 3988,
      "targetYO": 3000, "targetOM": 315, "targetOS": null, "targetYT": 180,
      "targetRataRataPenjualan": 3495, "persenCapaian": 114.1,
      "ratarataYOTahunLalu": 2914, "ratarataOMTahunLalu": null, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 184,
      "ratarataPenjualanTahunLalu": 3098, "persenTahunLalu": 128.7,
      "akmPenjualan": 123640, "akmTarget": 108345, "akmSelisih": 15295,
      "jwp": 310, "salesPerYL": 399, "salesPerYLTahunLalu": 311, "salesSelisih": 88,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 0, "r250_279": 2, "r280_299": 0, "r300_329": 2, "r330_349": 0, "lebih350": 6, "persenYLKurang250": 0.0 },
      "absen": { "jumlahYL": 1, "frekuensi": 0, "ewpPersen": 0.0 },
      "akmPDM": 133355, "akmKembaliBotol": 9715, "persenKembaliBotol": 7.3,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3495, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "apr": {
      "ratarataYO": 3297, "ratarataOM": 191, "ratarataOS": null, "ratarataYT": 145,
      "ratarataPenjualanYL": 3755,
      "targetYO": 2810, "targetOM": 415, "targetOS": null, "targetYT": 200,
      "targetRataRataPenjualan": 3425, "persenCapaian": 109.6,
      "ratarataYOTahunLalu": 3587, "ratarataOMTahunLalu": null, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 169,
      "ratarataPenjualanTahunLalu": 3756, "persenTahunLalu": 100.0,
      "akmPenjualan": 112650, "akmTarget": 102750, "akmSelisih": 9900,
      "jwp": 300, "salesPerYL": 376, "salesPerYLTahunLalu": 375, "salesSelisih": 1,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 0, "r250_279": 2, "r280_299": 0, "r300_329": 2, "r330_349": 0, "lebih350": 6, "persenYLKurang250": 0.0 },
      "absen": { "jumlahYL": 0, "frekuensi": 0, "ewpPersen": 0.0 },
      "akmPDM": 117600, "akmKembaliBotol": 4950, "persenKembaliBotol": 4.2,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3425, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "mei": {
      "ratarataYO": 3058, "ratarataOM": 185, "ratarataOS": null, "ratarataYT": 139,
      "ratarataPenjualanYL": 3380,
      "targetYO": 3335, "targetOM": 300, "targetOS": null, "targetYT": 180,
      "targetRataRataPenjualan": 3815, "persenCapaian": 88.6,
      "ratarataYOTahunLalu": 3118, "ratarataOMTahunLalu": null, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 168,
      "ratarataPenjualanTahunLalu": 3286, "persenTahunLalu": 102.9,
      "akmPenjualan": 104775, "akmTarget": 118265, "akmSelisih": -13490,
      "jwp": 310, "salesPerYL": 338, "salesPerYLTahunLalu": 328, "salesSelisih": 10,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 0, "r250_279": 4, "r280_299": 0, "r300_329": 2, "r330_349": 1, "lebih350": 3, "persenYLKurang250": 0.0 },
      "absen": { "jumlahYL": 0, "frekuensi": 0, "ewpPersen": 0.0 },
      "akmPDM": 113585, "akmKembaliBotol": 8810, "persenKembaliBotol": 7.8,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3815, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "jun": {
      "ratarataYO": 2944, "ratarataOM": 219, "ratarataOS": 631, "ratarataYT": 133,
      "ratarataPenjualanYL": 3927,
      "targetYO": 3000, "targetOM": 230, "targetOS": 350, "targetYT": 175,
      "targetRataRataPenjualan": 3755, "persenCapaian": 104.6,
      "ratarataYOTahunLalu": 2976, "ratarataOMTahunLalu": 686, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 181,
      "ratarataPenjualanTahunLalu": 3843, "persenTahunLalu": 102.2,
      "akmPenjualan": 117820, "akmTarget": 112650, "akmSelisih": 5170,
      "jwp": 300, "salesPerYL": 393, "salesPerYLTahunLalu": 384, "salesSelisih": 9,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 0, "r250_279": 0, "r280_299": 2, "r300_329": 2, "r330_349": 0, "lebih350": 6, "persenYLKurang250": 0.0 },
      "absen": { "jumlahYL": 0, "frekuensi": 0, "ewpPersen": 0.0 },
      "akmPDM": 130600, "akmKembaliBotol": 12780, "persenKembaliBotol": 9.8,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3755, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "jul": {
      "ratarataYO": 2799, "ratarataOM": 209, "ratarataOS": 478, "ratarataYT": 136,
      "ratarataPenjualanYL": 3624,
      "targetYO": 3025, "targetOM": 300, "targetOS": 350, "targetYT": 185,
      "targetRataRataPenjualan": 3860, "persenCapaian": 93.9,
      "ratarataYOTahunLalu": 2988, "ratarataOMTahunLalu": 468, "ratarataOSTahunLalu": null, "ratarataYTTahunLalu": 160,
      "ratarataPenjualanTahunLalu": 3616, "persenTahunLalu": 100.2,
      "akmPenjualan": 112355, "akmTarget": 119660, "akmSelisih": -7305,
      "jwp": 310, "salesPerYL": 362, "salesPerYLTahunLalu": 362, "salesSelisih": 0,
      "jumlahYL": 10, "targetJumlahYL": 10, "jumlahYLSelisih": 0,
      "jumlahYLTahunLalu": 10, "jumlahYLTahunLaluSelisih": 0,
      "jumlahYLDelivery": 10, "targetRekrut": 0, "jumlahYLBaru": 0, "jumlahYLBaruSelisih": 0,
      "jumlahYLResign": 0, "jumlahYLResignSelisih": 0, "jumlahYLResignKurang1Tahun": 0, "persenResignKurang1Tahun": null,
      "kondisiYL": { "propaganda": 0, "kurang250": 0, "r250_279": 1, "r280_299": 2, "r300_329": 2, "r330_349": 2, "lebih350": 3, "persenYLKurang250": 0.0 },
      "absen": { "jumlahYL": 0, "frekuensi": 0, "ewpPersen": 0.0 },
      "akmPDM": 128570, "akmKembaliBotol": 16215, "persenKembaliBotol": 12.6,
      "kondisiPotensi": { "persenPJLRumah": 0.0, "persenPJLToko": 0.0 },
      "jumlahArea": 10, "persenAreaTercover": 100.0,
      "targetSalesRingkasan": 3860, "evaluasiPlus": [], "evaluasiMinus": []
    },
    "agu": null, "sep": null, "okt": null, "nov": null, "des": null
  },
  "perYL": [
    { "no": 1, "area": "201", "nama": "GUSRINA",     "tglLulus": "2014", "tglDelivery": "29/01/2014", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 319, "feb": 292, "mar": 352, "apr": 352, "mei": 338, "jun": 408, "jul": 326, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 2, "area": "202", "nama": "DEWI A. A",   "tglLulus": "2010", "tglDelivery": "18/01/2010", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 422, "feb": 342, "mar": 387, "apr": 475, "mei": 372, "jun": 485, "jul": 454, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 3, "area": "203", "nama": "GUSRINI",     "tglLulus": "2010", "tglDelivery": "04/01/2010", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 461, "feb": 535, "mar": 516, "apr": 666, "mei": 580, "jun": 608, "jul": 541, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 4, "area": "204", "nama": "UMI M.",      "tglLulus": "2020", "tglDelivery": "14/09/2020", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 414, "feb": 349, "mar": 766, "apr": 410, "mei": 429, "jun": 471, "jul": 453, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 5, "area": "205", "nama": "SUYIK",       "tglLulus": "2010", "tglDelivery": "29/01/2010", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 258, "feb": 250, "mar": 362, "apr": 260, "mei": 258, "jun": 282, "jul": 269, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 6, "area": "206", "nama": "RIA RESTI W", "tglLulus": "2023", "tglDelivery": "09/01/2023", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 211, "feb": 158, "mar": 251, "apr": 253, "mei": 262, "jun": 322, "jul": 313, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 7, "area": "207", "nama": "ENDANG S.",   "tglLulus": "2021", "tglDelivery": "25/01/2021", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 338, "feb": 341, "mar": 464, "apr": 363, "mei": 316, "jun": 388, "jul": 343, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 8, "area": "208", "nama": "WAKI'AH",     "tglLulus": "2021", "tglDelivery": "08/02/2021", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 254, "feb": 298, "mar": 313, "apr": 364, "mei": 314, "jun": 371, "jul": 343, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 9, "area": "209", "nama": "TITIS S.",    "tglLulus": "2023", "tglDelivery": "19/06/2023", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 280, "feb": 250, "mar": 251, "apr": 300, "mei": 254, "jun": 378, "jul": 291, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } },
    { "no": 10, "area": "210", "nama": "ENI S.",    "tglLulus": "2011", "tglDelivery": "05/08/2011", "tglResign": null, "keterangan": "",
      "penjualan": { "jan": 250, "feb": 250, "mar": 323, "apr": 310, "mei": 253, "jun": 280, "jul": 288, "agu": null, "sep": null, "okt": null, "nov": null, "des": null },
      "rincian": { "jan": {"yo":0,"om":0,"os":0,"yt":0}, "feb": {"yo":0,"om":0,"os":0,"yt":0}, "mar": {"yo":0,"om":0,"os":0,"yt":0}, "apr": {"yo":0,"om":0,"os":0,"yt":0}, "mei": {"yo":0,"om":0,"os":0,"yt":0}, "jun": {"yo":0,"om":0,"os":0,"yt":0}, "jul": {"yo":0,"om":0,"os":0,"yt":0}, "agu": null, "sep": null, "okt": null, "nov": null, "des": null } }
  ]
};

const MONTHS = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
const MONTH_LABELS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function SalesRecordTKU({ defaultYear, defaultMonthIndex }: { defaultYear?: string, defaultMonthIndex?: number }) {
  const [data, setData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear || "2026");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(defaultMonthIndex ?? 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showRekapRataModal, setShowRekapRataModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [expandedYLs, setExpandedYLs] = useState<Record<number, boolean>>({});

  const toggleExpandYL = (idx: number) => {
    setExpandedYLs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const localData = localStorage.getItem(`sales_record_tku_${selectedYear}`);
        if (localData) {
          let parsed = JSON.parse(localData);
          // Migration: if area codes are 1-10, change to 201-210
          if (parsed && parsed.perYL && parsed.perYL.length > 0) {
            let migrated = false;
            parsed.perYL = parsed.perYL.map((yl: any) => {
              if (['1','2','3','4','5','6','7','8','9','10'].includes(String(yl.area))) {
                migrated = true;
                return { ...yl, area: String(200 + parseInt(yl.area)) };
              }
              return yl;
            });
            if (migrated) {
              localStorage.setItem(`sales_record_tku_${selectedYear}`, JSON.stringify(parsed));
              saveToSupabase(`sales_record_tku_${selectedYear}`, parsed).catch(console.error);
            }
          }
          setData(parsed);
        } else {
          // fetch from supabase
          const res = await loadFromSupabase<any>(`sales_record_tku_${selectedYear}`);
          if (res && res.tahun) {
            setData(res);
            localStorage.setItem(`sales_record_tku_${selectedYear}`, JSON.stringify(res));
          } else {
            // Seed
            if (selectedYear === "2026") {
              setData(SEED_DATA_2026);
              await saveToSupabase(`sales_record_tku_2026`, SEED_DATA_2026);
              localStorage.setItem(`sales_record_tku_2026`, JSON.stringify(SEED_DATA_2026));
            } else {
              setData(null);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    // If not editing, select current month to display
    if (!isEditing && data && data.bulanan) {
      // Find latest month with data if possible
      let latestIndex = 0;
      for (let i = 11; i >= 0; i--) {
        if (data.bulanan[MONTHS[i]] !== null) {
          latestIndex = i;
          break;
        }
      }
      setSelectedMonthIndex(latestIndex);
    }
  }, [data, isEditing]);

  const activeMonthKey = MONTHS[selectedMonthIndex];
  const activeMonthLabel = MONTH_LABELS[selectedMonthIndex];

  const handleEditModeToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditData(null);
    } else {
      setIsEditing(true);
      // Setup edit data for the selected month
      let monthData = data?.bulanan?.[activeMonthKey] || {};
      // deep clone to avoid mutating original state until saved
      const newData = JSON.parse(JSON.stringify(data || {
        tahun: parseInt(selectedYear),
        tku: "DP JEMBER 1",
        cabang: "JEMBER",
        jumlahYL: 10,
        hariPerBulan: { jan: 31, feb: 28, mar: 31, apr: 30, mei: 31, jun: 30, jul: 31, agu: 31, sep: 30, okt: 31, nov: 30, des: 31 },
        bulanan: {},
        perYL: []
      }));
      
      // Initialize month if null
      if (!newData.bulanan[activeMonthKey]) {
        newData.bulanan[activeMonthKey] = {
          ratarataYO: 0, ratarataYT: 0, ratarataOM: 0, ratarataOS: 0, ratarataPenjualanYL: 0,
          targetYO: 0, targetYT: 0, targetOM: 0, targetOS: 0, targetRataRataPenjualan: 0, persenCapaian: 0,
          ratarataYOTahunLalu: 0, ratarataYTTahunLalu: 0, ratarataOMTahunLalu: 0, ratarataOSTahunLalu: 0, ratarataPenjualanTahunLalu: 0, persenTahunLalu: 0,
          akmPenjualan: 0, akmTarget: 0, akmSelisih: 0, jwp: 0, salesPerYL: 0, salesPerYLTahunLalu: 0, salesSelisih: 0,
          jumlahYL: 10, targetJumlahYL: 10, jumlahYLSelisih: 0, jumlahYLTahunLalu: 10, jumlahYLTahunLaluSelisih: 0,
          jumlahYLDelivery: 10, targetRekrut: 0, jumlahYLBaru: 0, jumlahYLBaruSelisih: 0, jumlahYLResign: 0, jumlahYLResignSelisih: 0, jumlahYLResignKurang1Tahun: 0, persenResignKurang1Tahun: 0,
          kondisiYL: { propaganda: 0, kurang250: 0, r250_279: 0, r280_299: 0, r300_329: 0, r330_349: 0, lebih350: 0, persenYLKurang250: 0 },
          absen: { jumlahYL: 0, frekuensi: 0, ewpPersen: 0 },
          akmPDM: 0, akmKembaliBotol: 0, persenKembaliBotol: 0, kondisiPotensi: { persenPJLRumah: 0, persenPJLToko: 0 },
          jumlahArea: 10, persenAreaTercover: 100, targetSalesRingkasan: 0, evaluasiPlus: [], evaluasiMinus: []
        };
      }
      
      setEditData(newData);
    }
  };

  const handleFetchRata2TahunLalu = async () => {
    try {
      const res = await lookupPreviousYearData(selectedYear, selectedMonthIndex);
      if (res && res.found && res.ratarataPenjualanTahunLalu > 0) {
        setEditData((prev: any) => {
          const newD = JSON.parse(JSON.stringify(prev));
          const md = newD.bulanan[activeMonthKey];
          md.ratarataPenjualanTahunLalu = res.ratarataPenjualanTahunLalu;
          md.salesPerYLTahunLalu = res.salesPerYLTahunLalu;
          if (res.ratarataYOTahunLalu) md.ratarataYOTahunLalu = res.ratarataYOTahunLalu;
          if (res.ratarataOMTahunLalu) md.ratarataOMTahunLalu = res.ratarataOMTahunLalu;
          if (res.ratarataOSTahunLalu) md.ratarataOSTahunLalu = res.ratarataOSTahunLalu;
          if (res.ratarataYTTahunLalu) md.ratarataYTTahunLalu = res.ratarataYTTahunLalu;
          
          if (md.ratarataPenjualanYL > 0 && md.ratarataPenjualanTahunLalu > 0) {
            md.persenTahunLalu = Number(((md.ratarataPenjualanYL / md.ratarataPenjualanTahunLalu) * 100).toFixed(1));
          }
          if (md.salesPerYL && md.salesPerYLTahunLalu) {
            md.salesSelisih = md.salesPerYL - md.salesPerYLTahunLalu;
          }
          return newD;
        });

        alert(`✅ Berhasil menarik data Tahun Lalu (${res.sourceDescription}):\n• Rata-rata Penjualan: ${res.ratarataPenjualanTahunLalu} btl/hari\n• S/YL: ${res.salesPerYLTahunLalu} btl/hari\n• AKM Penjualan: ${res.akmPenjualanTahunLalu.toLocaleString('id-ID')} btl`);
      } else {
        alert(`Data arsip tahun lalu untuk bulan ${MONTH_LABELS[selectedMonthIndex]} (${selectedYear}) tidak ditemukan.`);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menarik data tahun lalu.");
    }
  };

  const handleSyncFromRata2 = async () => {
    try {
      const ymStr = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
      let parsed = null;
      
      const localData = localStorage.getItem(`rata2_bulanan_${ymStr}`);
      if (localData) {
        parsed = JSON.parse(localData);
      } else {
        try {
          const res = await loadFromSupabase(`rata2_bulanan_${ymStr}`);
          if (res && (res as any).rows) {
            parsed = res;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (parsed) {
        if (parsed.rows && parsed.rows.length > 0) {
          setEditData((prev: any) => {
            // FULL DEEP CLONE to ensure React re-renders all inputs
            const nd = JSON.parse(JSON.stringify(prev));
            let matchedCount = 0;
            parsed.rows.forEach((r2row: any) => {
              let ylIndex = nd.perYL.findIndex((yl: any) => String(yl.area).trim() === String(r2row.area).trim());
              
              if (ylIndex === -1) {
                ylIndex = nd.perYL.findIndex((yl: any) => String(yl.nama).trim().toLowerCase() === String(r2row.nama).trim().toLowerCase());
              }
              if (ylIndex === -1) {
                ylIndex = nd.perYL.findIndex((yl: any) => {
                  const a1 = parseInt(String(yl.area).replace(/\D/g, '')) || 0;
                  const a2 = parseInt(String(r2row.area).replace(/\D/g, '')) || 0;
                  return (a1 > 0 && a2 > 0) && ((a1 === a2) || (a1 > 200 && a1 - 200 === a2) || (a2 > 200 && a2 - 200 === a1));
                });
              }

              if (ylIndex >= 0) {
                matchedCount++;
                if (!nd.perYL[ylIndex].penjualan) nd.perYL[ylIndex].penjualan = {};
                if (!nd.perYL[ylIndex].rincian) nd.perYL[ylIndex].rincian = {};
                if (!nd.perYL[ylIndex].rincian[activeMonthKey]) nd.perYL[ylIndex].rincian[activeMonthKey] = { yo: 0, om: 0, os: 0, yt: 0 };
                
                // Parse float to ensure valid numbers, fallback 0
                const yo = parseFloat(r2row.yo);
                const om = parseFloat(r2row.om);
                const os = parseFloat(r2row.os);
                const yt = parseFloat(r2row.yt);
                const t = parseFloat(r2row.totalRata2);

                nd.perYL[ylIndex].penjualan[activeMonthKey] = isNaN(t) ? 0 : t;
                nd.perYL[ylIndex].rincian[activeMonthKey].yo = isNaN(yo) ? 0 : yo;
                nd.perYL[ylIndex].rincian[activeMonthKey].om = isNaN(om) ? 0 : om;
                nd.perYL[ylIndex].rincian[activeMonthKey].os = isNaN(os) ? 0 : os;
                nd.perYL[ylIndex].rincian[activeMonthKey].yt = isNaN(yt) ? 0 : yt;
              }
            });
            
            (window as any).__lastMatchedCount = matchedCount;
            return nd;
          });
          
          setTimeout(() => {
            const count = (window as any).__lastMatchedCount;
            if (count > 0) {
              alert(`Berhasil menarik ${count} baris data Rata-rata dari bulan ${activeMonthLabel} ${selectedYear}!`);
            } else {
              alert(`Data Rata-Rata berhasil ditemukan, tetapi tidak ada KODE AREA atau NAMA YL yang cocok. Pastikan Nama/Area YL sama persis.`);
            }
          }, 100);
        } else {
          alert(`Data Rata-Rata Bulanan untuk ${activeMonthLabel} ${selectedYear} kosong.`);
        }
      } else {
        alert(`Tidak menemukan data Rata-Rata Bulanan untuk ${activeMonthLabel} ${selectedYear}. Silakan isi dulu di menu tersebut.`);
      }
    } catch (e) {
      alert("Gagal menarik data rata-rata bulanan.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const payload = JSON.parse(JSON.stringify(editData));
      await saveToSupabase(`sales_record_tku_${selectedYear}`, payload);
      localStorage.setItem(`sales_record_tku_${selectedYear}`, JSON.stringify(payload));
      setData(payload);
      setIsEditing(false);
      setSaveStatus(`✅ Data bulan ${activeMonthLabel} ${selectedYear} berhasil disimpan.`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus(`❌ Gagal menyimpan data: ${(e as any).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Field change handler for edit mode
  const handleFieldChange = (field: string, value: any, nestedKey?: string) => {
    setEditData((prev: any) => {
      const newD = JSON.parse(JSON.stringify(prev)); // Deep clone to avoid mutating prev
      if (nestedKey) {
        newD.bulanan[activeMonthKey][field][nestedKey] = value;
      } else {
        newD.bulanan[activeMonthKey][field] = value;
      }

      // Auto-calculations
      const md = newD.bulanan[activeMonthKey];
      const p = md.kolomPembagi || 0;
      const akm = md.akmPenjualan || 0;
      const target = md.targetRataRataPenjualan || 0;
      const jmlYl = md.jumlahYL || 0;
      const thnLalu = md.ratarataPenjualanTahunLalu || 0;
      const botol = md.akmKembaliBotol || 0;
      const salesThnLalu = md.salesPerYLTahunLalu || 0;

      if (p > 0) {
        md.ratarataPenjualanYL = Math.round(akm / p);
        md.akmTarget = target * p;
        md.jwp = jmlYl * p;
      }
      
      if (target > 0) {
        md.persenCapaian = Number(((md.ratarataPenjualanYL / target) * 100).toFixed(1));
      }
      
      if (thnLalu > 0) {
        md.persenTahunLalu = Number(((md.ratarataPenjualanYL / thnLalu) * 100).toFixed(1));
      }
      
      md.akmSelisih = akm - (md.akmTarget || 0);
      
      if (md.jwp > 0) {
        md.salesPerYL = Math.round(akm / md.jwp);
      }
      
      md.salesSelisih = (md.salesPerYL || 0) - salesThnLalu;
      
      md.akmPDM = akm + botol;
      if (md.akmPDM > 0) {
        md.persenKembaliBotol = Number(((botol / md.akmPDM) * 100).toFixed(1));
      }

      return newD;
    });
  };

  const currentDisplayData = isEditing ? editData : data;
  const currentMonthData = currentDisplayData?.bulanan?.[activeMonthKey];

  // Computation for subtotal and total
  const computeTotals = useMemo(() => {
    if (!currentDisplayData) return null;
    
    // YL Sales Subtotals
    const ylTotals = currentDisplayData.perYL?.map((yl: any) => {
      const sem1 = ["jan", "feb", "mar", "apr", "mei", "jun"].reduce((sum, m) => sum + (yl.penjualan?.[m] || 0), 0);
      const sem2 = ["jul", "agu", "sep", "okt", "nov", "des"].reduce((sum, m) => sum + (yl.penjualan?.[m] || 0), 0);
      return { sem1, sem2, total: sem1 + sem2 };
    }) || [];

    const sm1Total = ylTotals.reduce((sum: number, yl: any) => sum + yl.sem1, 0);
    const sm2Total = ylTotals.reduce((sum: number, yl: any) => sum + yl.sem2, 0);
    
    // Bottom summary
    const summary = {
      totalSales: 0,
      totalTarget: 0,
      totalYL: 0,
      totalBaru: 0,
      totalResign: 0,
      monthsCount: 0
    };

    MONTHS.forEach(m => {
      const md = currentDisplayData.bulanan[m];
      if (md && md.ratarataPenjualanYL != null) {
        summary.totalSales += md.ratarataPenjualanYL;
        summary.totalTarget += md.targetSalesRingkasan || 0;
        summary.totalYL += md.jumlahYL || 0;
        summary.totalBaru += md.jumlahYLBaru || 0;
        summary.totalResign += md.jumlahYLResign || 0;
        summary.monthsCount += 1;
      }
    });

    return { ylTotals, sm1Total, sm2Total, summary };
  }, [currentDisplayData]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Memuat Data Sales Record TKU...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">Sales Record & Evaluasi TKU</h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
            {currentDisplayData?.tku || "DP JEMBER 1"} - {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={isEditing}
            className="p-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-sm outline-none text-slate-900"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
          <select
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
            disabled={isEditing}
            className="p-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-sm outline-none text-slate-900"
          >
            {MONTH_LABELS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-xl font-bold text-sm ${saveStatus.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {saveStatus}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="text-sm font-bold text-slate-700">
            Data Bulan: <span className="text-blue-600">{activeMonthLabel} {selectedYear}</span>
            {!currentMonthData && !isEditing && <span className="ml-2 px-2 py-1 bg-slate-200 text-slate-500 rounded text-xs">Kosong</span>}
          </div>
          <div>
            {!isEditing ? (
              <button
                onClick={handleEditModeToggle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Edit / Isi Bulan {activeMonthLabel}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSyncFromRata2}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  title="Tarik data dari menu Rata-Rata Bulanan"
                >
                  <Download className="w-4 h-4" /> Tarik Data Rata2
                </button>
                <button
                  onClick={handleEditModeToggle}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSaving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rekap 1 Tahun Modal */}
        {showRekapRataModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm sm:text-base font-black text-slate-800 uppercase">
                  Tabel Rata-Rata Penjualan YL - Tahun {selectedYear}
                </h2>
                <button 
                  onClick={() => setShowRekapRataModal(false)}
                  className="p-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="min-w-[1000px] sm:w-full">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-blue-900 text-white font-bold uppercase text-[9px] sm:text-[10px] sticky top-0 z-10">
                      <tr>
                        <th className="p-2 sm:p-3 border border-blue-800">No</th>
                        <th className="p-2 sm:p-3 border border-blue-800">Nama YL</th>
                        {MONTHS.map(m => (
                          <th key={m} className="p-2 sm:p-3 border border-blue-800 text-center">{m}</th>
                        ))}
                        <th className="p-2 sm:p-3 border border-blue-800 text-right bg-blue-950">Smt 1</th>
                        <th className="p-2 sm:p-3 border border-blue-800 text-right bg-blue-950">Smt 2</th>
                        <th className="p-2 sm:p-3 border border-blue-800 text-right bg-emerald-700">AKM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {currentDisplayData?.perYL?.map((yl: any, idx: number) => {
                        const totals = computeTotals?.ylTotals[idx] || { sem1: 0, sem2: 0, total: 0 };
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 sm:p-3 border border-slate-200 text-center">{idx + 1}</td>
                            <td className="p-2 sm:p-3 border border-slate-200 font-bold text-slate-800 whitespace-nowrap">{yl.nama}</td>
                            {MONTHS.map(m => (
                              <td key={m} className="p-2 sm:p-3 border border-slate-200 text-center text-slate-600">
                                {yl.penjualan?.[m] ?? "-"}
                              </td>
                            ))}
                            <td className="p-2 sm:p-3 border border-slate-200 text-right font-bold text-blue-900 bg-blue-50/50">{totals.sem1.toLocaleString()}</td>
                            <td className="p-2 sm:p-3 border border-slate-200 text-right font-bold text-blue-900 bg-blue-50/50">{totals.sem2.toLocaleString()}</td>
                            <td className="p-2 sm:p-3 border border-slate-200 text-right font-black text-emerald-700 bg-emerald-50/50">{totals.total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black sticky bottom-0 z-10 text-[9px] sm:text-[10px] uppercase">
                      <tr>
                        <td colSpan={2} className="p-2 sm:p-3 border border-slate-300 text-right text-slate-700">Total Keseluruhan</td>
                        {MONTHS.map(m => {
                          const monthSum = currentDisplayData?.perYL?.reduce((sum: number, yl: any) => sum + (yl.penjualan?.[m] || 0), 0) || 0;
                          return (
                            <td key={m} className="p-2 sm:p-3 border border-slate-300 text-center text-slate-700">{monthSum > 0 ? monthSum.toLocaleString() : "-"}</td>
                          );
                        })}
                        <td className="p-2 sm:p-3 border border-slate-300 text-right text-blue-900">{computeTotals?.sm1Total.toLocaleString()}</td>
                        <td className="p-2 sm:p-3 border border-slate-300 text-right text-blue-900">{computeTotals?.sm2Total.toLocaleString()}</td>
                        <td className="p-2 sm:p-3 border border-slate-300 text-right text-emerald-800">{((computeTotals?.sm1Total || 0) + (computeTotals?.sm2Total || 0)).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form / View Content */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          {!currentMonthData && !isEditing ? (
            <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Data bulan {activeMonthLabel} belum diisi.</p>
              <button
                onClick={handleEditModeToggle}
                className="mt-4 text-blue-600 font-bold text-sm hover:underline cursor-pointer"
              >
                Isi Data Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pembagi Section */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-full sm:w-1/3">
                    <InputBox label="KOLOM PEMBAGI" val={currentMonthData?.kolomPembagi} isEditing={isEditing} onChange={(v) => handleFieldChange('kolomPembagi', v)} className="bg-white border-emerald-300 shadow-sm font-black text-emerald-700" />
                  </div>
                  <div className="text-xs text-emerald-800 flex-1">
                    <span className="font-bold">Info:</span> Angka pada Kolom Pembagi ini digunakan sebagai dasar untuk menghitung Rata-rata, Akm Target, JWP secara otomatis.
                  </div>
                </div>
              </div>

              {/* Rata-Rata Section */}
              <section>
                <h3 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4 border-slate-200">1. Data Rata-Rata Penjualan</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <InputBox label="Rata-rata YO" val={currentMonthData?.ratarataYO} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataYO', v)} />
                    <InputBox label="Rata-rata OM" val={currentMonthData?.ratarataOM} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataOM', v)} />
                    <InputBox label="Rata-rata OS" val={currentMonthData?.ratarataOS} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataOS', v)} />
                    <InputBox label="Rata-rata YT" val={currentMonthData?.ratarataYT} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataYT', v)} />
                    <InputBox label="Rata2 Penjualan YL" val={currentMonthData?.ratarataPenjualanYL} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataPenjualanYL', v)} className="bg-blue-50 border-blue-200" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <InputBox label="Target YO" val={currentMonthData?.targetYO} isEditing={isEditing} onChange={(v) => handleFieldChange('targetYO', v)} className="bg-orange-50 border-orange-200" />
                    <InputBox label="Target OM" val={currentMonthData?.targetOM} isEditing={isEditing} onChange={(v) => handleFieldChange('targetOM', v)} className="bg-orange-50 border-orange-200" />
                    <InputBox label="Target OS" val={currentMonthData?.targetOS} isEditing={isEditing} onChange={(v) => handleFieldChange('targetOS', v)} className="bg-orange-50 border-orange-200" />
                    <InputBox label="Target YT" val={currentMonthData?.targetYT} isEditing={isEditing} onChange={(v) => handleFieldChange('targetYT', v)} className="bg-orange-50 border-orange-200" />
                    <InputBox label="Target Rata2 Pjl" val={currentMonthData?.targetRataRataPenjualan} isEditing={isEditing} onChange={(v) => handleFieldChange('targetRataRataPenjualan', v)} className="bg-orange-50 border-orange-200" />
                    <InputBox label="% Capaian" val={currentMonthData?.persenCapaian} isEditing={isEditing} onChange={(v) => handleFieldChange('persenCapaian', v)} step="0.1" suffix="%" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <InputBox label="Rata2 YO Thn Lalu" val={currentMonthData?.ratarataYOTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataYOTahunLalu', v)} className="bg-slate-100" />
                    <InputBox label="Rata2 OM Thn Lalu" val={currentMonthData?.ratarataOMTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataOMTahunLalu', v)} className="bg-slate-100" />
                    <InputBox label="Rata2 OS Thn Lalu" val={currentMonthData?.ratarataOSTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataOSTahunLalu', v)} className="bg-slate-100" />
                    <InputBox label="Rata2 YT Thn Lalu" val={currentMonthData?.ratarataYTTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataYTTahunLalu', v)} className="bg-slate-100" />
                    <div className="relative">
                      <div className="relative">
                      <InputBox label="Rata2 Pjl Thn Lalu" val={currentMonthData?.ratarataPenjualanTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('ratarataPenjualanTahunLalu', v)} className="bg-slate-100" />
                      {isEditing && (
                        <button
                          onClick={handleFetchRata2TahunLalu}
                          className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white text-[9px] px-2 py-1 rounded shadow"
                          title="Tarik dari Data Rata2 Bulan Sama Tahun Lalu"
                        >
                          Tarik Thn Lalu
                        </button>
                      )}
                    </div>
                      {isEditing && (
                        <button
                          onClick={handleFetchRata2TahunLalu}
                          className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white text-[9px] px-2 py-1 rounded shadow"
                          title="Tarik dari Data Rata2 Bulan Sama Tahun Lalu"
                        >
                          Tarik Thn Lalu
                        </button>
                      )}
                    </div>
                    <InputBox label="% Thn Lalu" val={currentMonthData?.persenTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('persenTahunLalu', v)} step="0.1" suffix="%" />
                  </div>
                </div>
              </section>

              {/* Akumulasi & Sales */}
              <section>
                <h3 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4 border-slate-200">2. Akumulasi & Sales/YL</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-3">
                  <InputBox label="AKM Penjualan" val={currentMonthData?.akmPenjualan} isEditing={isEditing} onChange={(v) => handleFieldChange('akmPenjualan', v)} />
                  <InputBox label="AKM Target" val={currentMonthData?.akmTarget} isEditing={isEditing} onChange={(v) => handleFieldChange('akmTarget', v)} />
                  <InputBox label="AKM Selisih" val={currentMonthData?.akmSelisih} isEditing={isEditing} onChange={(v) => handleFieldChange('akmSelisih', v)} />
                  <InputBox label="JWP" val={currentMonthData?.jwp} isEditing={isEditing} onChange={(v) => handleFieldChange('jwp', v)} />
                  <InputBox label="Sales/YL" val={currentMonthData?.salesPerYL} isEditing={isEditing} onChange={(v) => handleFieldChange('salesPerYL', v)} />
                  <InputBox label="Sales/YL Thn Lalu" val={currentMonthData?.salesPerYLTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('salesPerYLTahunLalu', v)} />
                  <InputBox label="Selisih Sales" val={currentMonthData?.salesSelisih} isEditing={isEditing} onChange={(v) => handleFieldChange('salesSelisih', v)} />
                </div>
              </section>

              {/* Kondisi YL & Rekrutmen */}
              <section>
                <h3 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4 border-slate-200">3. Kondisi YL, Rekrutmen & Absensi</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <InputBox label="Jumlah YL" val={currentMonthData?.jumlahYL} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYL', v)} className="bg-emerald-50 border-emerald-200" />
                    <InputBox label="Target Jml YL" val={currentMonthData?.targetJumlahYL} isEditing={isEditing} onChange={(v) => handleFieldChange('targetJumlahYL', v)} />
                    <InputBox label="Selisih YL" val={currentMonthData?.jumlahYLSelisih} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLSelisih', v)} />
                    <InputBox label="Jml YL Thn Lalu" val={currentMonthData?.jumlahYLTahunLalu} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLTahunLalu', v)} />
                    <InputBox label="Selisih YL Thn Lalu" val={currentMonthData?.jumlahYLTahunLaluSelisih} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLTahunLaluSelisih', v)} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <InputBox label="YL Delivery" val={currentMonthData?.jumlahYLDelivery} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLDelivery', v)} />
                    <InputBox label="Target Rekrut" val={currentMonthData?.targetRekrut} isEditing={isEditing} onChange={(v) => handleFieldChange('targetRekrut', v)} />
                    <InputBox label="YL Baru" val={currentMonthData?.jumlahYLBaru} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLBaru', v)} className="bg-blue-50 border-blue-200" />
                    <InputBox label="Selisih YL Baru" val={currentMonthData?.jumlahYLBaruSelisih} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLBaruSelisih', v)} />
                    <InputBox label="YL Resign" val={currentMonthData?.jumlahYLResign} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLResign', v)} className="bg-rose-50 border-rose-200" />
                    <InputBox label="Selisih Resign" val={currentMonthData?.jumlahYLResignSelisih} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLResignSelisih', v)} />
                    <InputBox label="Resign <1 Thn" val={currentMonthData?.jumlahYLResignKurang1Tahun} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahYLResignKurang1Tahun', v)} />
                    <InputBox label="% Resign <1 Thn" val={currentMonthData?.persenResignKurang1Tahun} isEditing={isEditing} onChange={(v) => handleFieldChange('persenResignKurang1Tahun', v)} step="0.1" suffix="%" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InputBox label="Absen (Jml YL)" val={currentMonthData?.absen?.jumlahYL} isEditing={isEditing} onChange={(v) => handleFieldChange('absen', v, 'jumlahYL')} />
                    <InputBox label="Absen (Frekuensi)" val={currentMonthData?.absen?.frekuensi} isEditing={isEditing} onChange={(v) => handleFieldChange('absen', v, 'frekuensi')} />
                    <InputBox label="EWP %" val={currentMonthData?.absen?.ewpPersen} isEditing={isEditing} onChange={(v) => handleFieldChange('absen', v, 'ewpPersen')} step="0.1" suffix="%" />
                  </div>
                </div>
              </section>

              {/* Kondisi YL Breakdown */}
              <section>
                <h3 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4 border-slate-200">4. Rincian Kondisi YL</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  <InputBox label="Propaganda" val={currentMonthData?.kondisiYL?.propaganda} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'propaganda')} />
                  <InputBox label="< 250" val={currentMonthData?.kondisiYL?.kurang250} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'kurang250')} />
                  <InputBox label="250 - 279" val={currentMonthData?.kondisiYL?.r250_279} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'r250_279')} />
                  <InputBox label="280 - 299" val={currentMonthData?.kondisiYL?.r280_299} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'r280_299')} />
                  <InputBox label="300 - 329" val={currentMonthData?.kondisiYL?.r300_329} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'r300_329')} />
                  <InputBox label="330 - 349" val={currentMonthData?.kondisiYL?.r330_349} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'r330_349')} />
                  <InputBox label="> 350" val={currentMonthData?.kondisiYL?.lebih350} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'lebih350')} />
                  <InputBox label="% YL < 250" val={currentMonthData?.kondisiYL?.persenYLKurang250} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiYL', v, 'persenYLKurang250')} step="0.1" suffix="%" className="bg-rose-50" />
                </div>
              </section>

              {/* Potensi & Area */}
              <section>
                <h3 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4 border-slate-200">5. Potensi & Penetrasi Area</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  <InputBox label="AKM PDM" val={currentMonthData?.akmPDM} isEditing={isEditing} onChange={(v) => handleFieldChange('akmPDM', v)} />
                  <InputBox label="AKM Kembali Botol" val={currentMonthData?.akmKembaliBotol} isEditing={isEditing} onChange={(v) => handleFieldChange('akmKembaliBotol', v)} />
                  <InputBox label="% Kembali Botol" val={currentMonthData?.persenKembaliBotol} isEditing={isEditing} onChange={(v) => handleFieldChange('persenKembaliBotol', v)} step="0.1" suffix="%" />
                  <InputBox label="% PJL Rumah" val={currentMonthData?.kondisiPotensi?.persenPJLRumah} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiPotensi', v, 'persenPJLRumah')} step="0.1" suffix="%" />
                  <InputBox label="% PJL Toko" val={currentMonthData?.kondisiPotensi?.persenPJLToko} isEditing={isEditing} onChange={(v) => handleFieldChange('kondisiPotensi', v, 'persenPJLToko')} step="0.1" suffix="%" />
                  <InputBox label="Jumlah Area" val={currentMonthData?.jumlahArea} isEditing={isEditing} onChange={(v) => handleFieldChange('jumlahArea', v)} />
                  <InputBox label="% Area Tercover" val={currentMonthData?.persenAreaTercover} isEditing={isEditing} onChange={(v) => handleFieldChange('persenAreaTercover', v)} step="0.1" suffix="%" />
                </div>
              </section>

              {/* Tabel Penjualan per YL */}
              <section>
                <div className="flex justify-between items-center border-b pb-2 mb-4 border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase">6. Penjualan Per YL (Bulan {activeMonthLabel})</h3>
                  <button 
                    onClick={() => setShowRekapRataModal(true)}
                    className="bg-blue-600 text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-lg shadow font-bold hover:bg-blue-700"
                  >
                    Rekap 1 Tahun
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="w-8 p-3 border-b border-slate-200 text-center"></th>
                        <th className="p-3 border-b border-slate-200">No</th>
                        <th className="p-3 border-b border-slate-200">Area</th>
                        <th className="p-3 border-b border-slate-200">Nama YL</th>
                        <th className="p-3 border-b border-slate-200 text-right">Penjualan ({activeMonthLabel})</th>
                        <th className="p-3 border-b border-slate-200 text-right">Smstr 1</th>
                        <th className="p-3 border-b border-slate-200 text-right">Smstr 2</th>
                        <th className="p-3 border-b border-slate-200 text-right">Total Thn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDisplayData?.perYL?.map((yl: any, idx: number) => {
                        const val = yl.penjualan?.[activeMonthKey];
                        const totals = computeTotals?.ylTotals[idx] || { sem1: 0, sem2: 0, total: 0 };
                        const isExpanded = !!expandedYLs[idx];
                        const rincian = yl.rincian?.[activeMonthKey] || { yo: 0, om: 0, os: 0, yt: 0 };
                        
                        return (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-slate-50">
                              <td className="p-3 text-center">
                                <button onClick={() => toggleExpandYL(idx)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-3 font-medium text-slate-500">{yl.no}</td>
                              <td className="p-3 font-bold text-slate-700">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.perYL?.[idx]?.area ?? ""}
                                    onChange={(e) => {
                                      setEditData((prev: any) => {
                                        const nd = { ...prev };
                                        nd.perYL[idx].area = e.target.value;
                                        return nd;
                                      });
                                    }}
                                    className="w-16 p-1 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none text-slate-900"
                                  />
                                ) : (
                                  <span className="text-slate-900">{yl.area}</span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.perYL?.[idx]?.nama ?? ""}
                                    onChange={(e) => {
                                      setEditData((prev: any) => {
                                        const nd = { ...prev };
                                        nd.perYL[idx].nama = e.target.value;
                                        return nd;
                                      });
                                    }}
                                    className="w-32 md:w-full p-1 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none text-slate-900"
                                  />
                                ) : (
                                  <span className="text-slate-900">{yl.nama}</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editData?.perYL?.[idx]?.penjualan?.[activeMonthKey] ?? ""}
                                    onPaste={(e) => {
                                      const pasteData = e.clipboardData.getData('text');
                                      if (pasteData) {
                                        e.preventDefault();
                                        const rows = pasteData.trim().split(/\r?\n/);
                                        if (rows.length > 0) {
                                          setEditData((prev: any) => {
                                            const nd = { ...prev };
                                            rows.forEach((rowStr, offset) => {
                                              const targetIdx = idx + offset;
                                              if (targetIdx < nd.perYL.length) {
                                                const cleaned = rowStr.split('\t')[0].replace(/[^0-9.-]/g, '');
                                                if (cleaned !== '') {
                                                  if (!nd.perYL[targetIdx].penjualan) nd.perYL[targetIdx].penjualan = {};
                                                  nd.perYL[targetIdx].penjualan[activeMonthKey] = Number(cleaned);
                                                }
                                              }
                                            });
                                            return nd;
                                          });
                                        }
                                      }
                                    }}
                                    onChange={(e) => {
                                      const v = e.target.value ? Number(e.target.value) : null;
                                      setEditData((prev: any) => {
                                        const nd = { ...prev };
                                        if (!nd.perYL[idx].penjualan) nd.perYL[idx].penjualan = {};
                                        nd.perYL[idx].penjualan[activeMonthKey] = v;
                                        return nd;
                                      });
                                    }}
                                    className="w-20 p-1.5 text-right border border-slate-300 rounded focus:border-blue-500 outline-none text-slate-900"
                                  />
                                ) : (
                                  <span className="font-black text-slate-900">{typeof val === "number" && !Number.isInteger(val) ? val.toFixed(2) : (val ?? "-")}</span>
                                )}
                              </td>
                              <td className="p-3 text-right text-slate-900 font-black">{typeof totals.sem1 === "number" && !Number.isInteger(totals.sem1) ? totals.sem1.toFixed(2) : totals.sem1}</td>
                              <td className="p-3 text-right text-slate-900 font-black">{typeof totals.sem2 === "number" && !Number.isInteger(totals.sem2) ? totals.sem2.toFixed(2) : totals.sem2}</td>
                              <td className="p-3 text-right font-black text-slate-800">{typeof totals.total === "number" && !Number.isInteger(totals.total) ? totals.total.toFixed(2) : totals.total}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={8} className="p-4 border-b border-slate-100">
                                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center text-xs ml-10 border-l-2 border-blue-200 pl-4 py-1">
                                    <div className="flex gap-4">
                                      <div className="space-y-1.5">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rincian Varian (Bulan {activeMonthLabel})</p>
                                        <div className="flex gap-2">
                                          {['yo', 'om', 'os', 'yt'].map(vKey => (
                                            <div key={vKey} className="flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 min-w-[60px] shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">{vKey}</span>
                                              {isEditing ? (
                                                <input
                                                  type="number"
                                                  value={editData?.perYL?.[idx]?.rincian?.[activeMonthKey]?.[vKey] ?? ""}
                                                  onPaste={(e) => {
                                                    const pasteData = e.clipboardData.getData('text');
                                                    if (pasteData) {
                                                      e.preventDefault();
                                                      const rows = pasteData.trim().split(/\r?\n/);
                                                      const variantKeys = ['yo', 'om', 'os', 'yt'];
                                                      const startColIndex = variantKeys.indexOf(vKey);
                                                      
                                                      if (rows.length > 0) {
                                                        setEditData((prev: any) => {
                                                          const nd = { ...prev };
                                                          rows.forEach((rowStr, rowOffset) => {
                                                            const targetIdx = idx + rowOffset;
                                                            if (targetIdx < nd.perYL.length) {
                                                              const cols = rowStr.split('\t');
                                                              cols.forEach((colStr, colOffset) => {
                                                                const targetColIndex = startColIndex + colOffset;
                                                                if (targetColIndex < variantKeys.length) {
                                                                  const targetKey = variantKeys[targetColIndex];
                                                                  let parsedStr = colStr;
                                                                  if (parsedStr.includes(',')) parsedStr = parsedStr.replace(/\./g, '').replace(',', '.');
                                                                  const cleaned = parsedStr.replace(/[^0-9.-]/g, '');
                                                                  if (cleaned !== '') {
                                                                    if (!nd.perYL[targetIdx].rincian) nd.perYL[targetIdx].rincian = {};
                                                                    if (!nd.perYL[targetIdx].rincian[activeMonthKey]) nd.perYL[targetIdx].rincian[activeMonthKey] = { yo: 0, om: 0, os: 0, yt: 0 };
                                                                    nd.perYL[targetIdx].rincian[activeMonthKey][targetKey] = Number(cleaned);
                                                                  }
                                                                }
                                                              });
                                                            }
                                                          });
                                                          return nd;
                                                        });
                                                      }
                                                    }
                                                  }}
                                                  onChange={(e) => {
                                                    const v = e.target.value ? Number(e.target.value) : 0;
                                                    setEditData((prev: any) => {
                                                      const nd = { ...prev };
                                                      if (!nd.perYL[idx].rincian) nd.perYL[idx].rincian = {};
                                                      if (!nd.perYL[idx].rincian[activeMonthKey]) nd.perYL[idx].rincian[activeMonthKey] = { yo: 0, om: 0, os: 0, yt: 0 };
                                                      nd.perYL[idx].rincian[activeMonthKey][vKey] = v;
                                                      return nd;
                                                    });
                                                  }}
                                                  className="w-14 p-1 text-center text-xs font-bold border border-slate-300 rounded focus:border-blue-500 outline-none bg-slate-50 text-slate-900"
                                                />
                                              ) : (
                                                <span className="font-black text-slate-700 text-sm">{typeof rincian[vKey] === "number" && !Number.isInteger(rincian[vKey]) ? Number(rincian[vKey]).toFixed(2) : (rincian[vKey] ?? 0)}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 hidden md:block">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Informasi YL</p>
                                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1 min-w-[200px] shadow-sm">
                                        <div className="flex justify-between items-center"><span className="text-slate-400">Tgl Lulus:</span> 
                                          {isEditing ? (
                                            <input type="date" value={editData?.perYL?.[idx]?.tglLulus || ""} onChange={(e) => {
                                              setEditData((prev: any) => {
                                                const nd = { ...prev };
                                                nd.perYL[idx].tglLulus = e.target.value;
                                                return nd;
                                              });
                                            }} className="border p-0.5 rounded text-[10px] text-slate-900 w-24" />
                                          ) : (
                                            <span className="font-bold text-slate-900">{yl.tglLulus || "-"}</span>
                                          )}
                                        </div>
                                        <div className="flex justify-between items-center"><span className="text-slate-400">Tgl Delivery:</span> 
                                          {isEditing ? (
                                            <input type="date" value={editData?.perYL?.[idx]?.tglDelivery || ""} onChange={(e) => {
                                              setEditData((prev: any) => {
                                                const nd = { ...prev };
                                                nd.perYL[idx].tglDelivery = e.target.value;
                                                return nd;
                                              });
                                            }} className="border p-0.5 rounded text-[10px] text-slate-900 w-24" />
                                          ) : (
                                            <span className="font-bold text-slate-900">{yl.tglDelivery || "-"}</span>
                                          )}
                                        </div>
                                        <div className="flex justify-between items-center"><span className="text-slate-400">Tgl Resign:</span> 
                                          {isEditing ? (
                                            <input type="date" value={editData?.perYL?.[idx]?.tglResign || ""} onChange={(e) => {
                                              setEditData((prev: any) => {
                                                const nd = { ...prev };
                                                nd.perYL[idx].tglResign = e.target.value;
                                                return nd;
                                              });
                                            }} className="border p-0.5 rounded text-[10px] text-slate-900 w-24" />
                                          ) : (
                                            <span className="font-bold text-slate-900">{yl.tglResign || "-"}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Evaluasi Section */}
              <section>
                <h3 className="text-sm font-black text-slate-800 uppercase border-b pb-2 mb-4 border-slate-200">7. Evaluasi Kondisi TKU (Bulan {activeMonthLabel})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Hal Positif (+)</p>
                    {isEditing ? (
                      <textarea
                        value={(editData?.bulanan?.[activeMonthKey]?.evaluasiPlus || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          handleFieldChange('evaluasiPlus', lines);
                        }}
                        className="w-full h-24 p-2 text-xs border border-emerald-300 rounded-xl outline-none focus:border-emerald-500 bg-white text-slate-900"
                        placeholder="Tulis poin-poin positif di sini (satu poin per baris)..."
                      />
                    ) : (
                      <ul className="list-disc pl-4 text-xs font-medium text-emerald-900 space-y-1">
                        {(currentMonthData?.evaluasiPlus || []).filter((s: string) => s.trim() !== "").map((pt: string, i: number) => (
                          <li key={i}>{pt}</li>
                        ))}
                        {!(currentMonthData?.evaluasiPlus || []).some((s: string) => s.trim() !== "") && (
                          <li className="text-emerald-600/50 italic list-none -ml-4">Belum ada catatan evaluasi positif.</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <p className="text-xs font-bold text-rose-800 uppercase mb-2">Hal Negatif / Kendala (-)</p>
                    {isEditing ? (
                      <textarea
                        value={(editData?.bulanan?.[activeMonthKey]?.evaluasiMinus || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          handleFieldChange('evaluasiMinus', lines);
                        }}
                        className="w-full h-24 p-2 text-xs border border-rose-300 rounded-xl outline-none focus:border-rose-500 bg-white text-slate-900"
                        placeholder="Tulis poin-poin kendala di sini (satu poin per baris)..."
                      />
                    ) : (
                      <ul className="list-disc pl-4 text-xs font-medium text-rose-900 space-y-1">
                        {(currentMonthData?.evaluasiMinus || []).filter((s: string) => s.trim() !== "").map((pt: string, i: number) => (
                          <li key={i}>{pt}</li>
                        ))}
                        {!(currentMonthData?.evaluasiMinus || []).some((s: string) => s.trim() !== "") && (
                          <li className="text-rose-600/50 italic list-none -ml-4">Belum ada catatan kendala.</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              {/* Summary Bottom */}
              <section>
                <div className="bg-slate-800 text-white rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row gap-6 justify-between items-center shadow-lg">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sales {selectedYear}</p>
                    <p className="text-2xl font-black text-emerald-400">{computeTotals?.summary.totalSales.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Target: {computeTotals?.summary.totalTarget.toLocaleString()} | 
                      Capaian: {computeTotals?.summary.totalTarget ? ((computeTotals.summary.totalSales / computeTotals.summary.totalTarget) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="flex gap-4 md:gap-8">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">YL Aktif Rata2</p>
                      <p className="text-lg font-black">{computeTotals?.summary.monthsCount ? Math.round(computeTotals.summary.totalYL / computeTotals.summary.monthsCount) : 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Baru</p>
                      <p className="text-lg font-black text-blue-400">{computeTotals?.summary.totalBaru}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Resign</p>
                      <p className="text-lg font-black text-rose-400">{computeTotals?.summary.totalResign}</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for input fields
function InputBox({ label, val, isEditing, onChange, step, suffix, className }: { label: string, val: any, isEditing: boolean, onChange?: (v: any) => void, step?: string, suffix?: string, className?: string }) {
  return (
    <div className={`p-2 sm:p-3 rounded-xl border border-slate-100 bg-slate-50 ${className || ''}`}>
      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">{label}</label>
      {isEditing ? (
        <div className="flex items-center">
          <input
            type="number"
            step={step || "1"}
            value={val ?? ""}
            onPaste={(e) => {
            const pasteData = e.clipboardData.getData('text');
            if (pasteData) {
              let parsedStr = pasteData;
              if (parsedStr.includes(',')) parsedStr = parsedStr.replace(/\./g, '').replace(',', '.');
              const cleaned = parsedStr.replace(/[^0-9.-]/g, '');
              if (cleaned && onChange) {
                e.preventDefault();
                onChange(Number(cleaned));
              }
            }
          }}
            onChange={(e) => onChange && onChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-1.5 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded focus:border-blue-500 outline-none text-slate-900"
          />
          {suffix && <span className="text-xs font-bold text-slate-400 ml-1">{suffix}</span>}
        </div>
      ) : (
        <p className="text-sm sm:text-base font-black text-slate-900">
          {val ?? "-"} {suffix && val != null && <span className="text-xs font-bold text-slate-400">{suffix}</span>}
        </p>
      )}
    </div>
  );
}
