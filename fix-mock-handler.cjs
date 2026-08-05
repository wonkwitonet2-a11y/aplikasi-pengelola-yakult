const fs = require('fs');
let code = fs.readFileSync('src/components/archive/ArchiveEditor.tsx', 'utf8');

const correctLhppSave = `
    if (path === "/api/saveLhppPdm") {
      try {
         const body = JSON.parse(options.body);
         setSnapshot((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (!next.lhppPdm) next.lhppPdm = {};
            if (!next.lhppPdmYlm) next.lhppPdmYlm = {};
            if (!next.transactions) next.transactions = [];
            
            const dateKey = body.tanggal || \`\${body.month}-\${String(body.day || 1).padStart(2, '0')}\`;
            
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
                 const ylKey = areaKey || r.nama.replace(/^\\d+\\s*/, "").toUpperCase();
                 
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
`;

// Replace the old mock saveLhppPdm
code = code.replace(/if \(path === "\/api\/saveLhppPdm"\) \{[\s\S]*?\} catch\(e\) \{ return \{ ok: false \}; \}\n    \}/, correctLhppSave);

fs.writeFileSync('src/components/archive/ArchiveEditor.tsx', code);
