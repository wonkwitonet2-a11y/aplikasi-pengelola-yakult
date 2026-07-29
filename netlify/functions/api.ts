import serverless from "serverless-http";
import { app, ensureDbReady } from "../../server.ts";

// serverless-http bungkus Express app kita jadi handler AWS Lambda/Netlify.
// Data (dari Supabase, atau data.json lokal sebagai fallback) HARUS sudah
// termuat ke memori SEBELUM request diteruskan ke Express — sebelumnya kode
// ini memanggil loadData() tanpa "await" (padahal loadData sinkron & hanya
// baca data.json), sehingga tidak pernah menunggu proses baca dari Supabase.
// ensureDbReady() sendiri di-cache (hanya benar-benar mengambil data sekali
// per cold start container Netlify), jadi warm invocation berikutnya sangat
// cepat (tidak query ulang ke Supabase tiap request).
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  await ensureDbReady();
  return serverlessHandler(event, context);
};
