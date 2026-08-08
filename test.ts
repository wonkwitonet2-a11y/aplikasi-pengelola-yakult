export function calculateMasaKerja(tanggalMasuk: string | undefined) {
  if (!tanggalMasuk) return { text: "-", years: 0, months: 0, title: "Yakult Lady" };

  const start = new Date(tanggalMasuk);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  let text = "";
  if (years > 0) text += `${years} Tahun `;
  if (months > 0) text += `${months} Bulan`;
  if (years === 0 && months === 0) text = "Baru Bergabung";

  let title = "Yakult Lady Pemula";
  if (years >= 1 && years < 3) title = "Yakult Lady Pratama";
  else if (years >= 3 && years < 5) title = "Yakult Lady Madya";
  else if (years >= 5 && years < 10) title = "Yakult Lady Utama";
  else if (years >= 10 && years < 15) title = "Yakult Lady Senior";
  else if (years >= 15 && years < 20) title = "Yakult Lady Veteran";
  else if (years >= 20 && years < 25) title = "Yakult Lady Master";
  else if (years >= 25) title = "Yakult Lady Legend";

  return { text: text.trim(), years, months, title };
}
