import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Add useSimpleGrid for targetTKU around line 842

target_tku_hooks = """
  const getTargetTKUCellValue = useCallback((r: number, c: number) => {
    const fields = ["target_yo", "target_om", "target_os", "target_yt"] as const;
    return targetTKU[fields[c]] ?? 0;
  }, [targetTKU]);

  const setTargetTKUBatchCellValues = useCallback((updates: { r: number; c: number; val: number | string }[]) => {
    setTargetTKU(prev => {
      let next = { ...prev };
      const fields = ["target_yo", "target_om", "target_os", "target_yt"] as const;
      updates.forEach(({ c, val }) => {
        const numVal = Math.max(0, Math.round(Number(val)) || 0);
        next = { ...next, [fields[c]]: numVal };
      });
      next.target = (next.target_yo ?? 0) + (next.target_om ?? 0) + (next.target_os ?? 0) + (next.target_yt ?? 0);
      return next;
    });
  }, []);

  const {
    selection: tkuGridSelection,
    setSelection: setTkuGridSelection,
    getCellProps: getTkuCellProps,
    handleCopy: handleTkuGridCopy,
    handleCut: handleTkuGridCut,
    handlePaste: handleTkuGridPaste,
    handleClear: handleTkuGridClear,
    handleSelectAll: handleTkuGridSelectAll
  } = useSimpleGrid({
    totalRows: 1,
    totalCols: 4,
    getCellValue: getTargetTKUCellValue,
    setBatchCellValues: setTargetTKUBatchCellValues
  });
"""

content = content.replace("  // Kosongkan seleksi grid Target saat pindah tab", target_tku_hooks + "\n  // Kosongkan seleksi grid Target saat pindah tab")

# Replace Target TKU Table HTML 
old_table_tku = """                      {/* Target TKU Row */}
                      <tr>
                        <td className="p-2.5 font-black text-red-700 uppercase text-[10px]">Target TKU</td>
                        <td className="p-2 text-center">
                          <NumberInput
                            min={0}
                            value={targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85)}
                            onChange={(yo) => {
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_yo: yo, target: yo + om + os + yt });
                            }}
                            className="p-1 text-xs bg-slate-50 border border-slate-200 rounded text-center w-16 text-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <NumberInput
                            min={0}
                            value={targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08)}
                            onChange={(om) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_om: om, target: yo + om + os + yt });
                            }}
                            className="p-1 text-xs bg-slate-50 border border-slate-200 rounded text-center w-16 text-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <NumberInput
                            min={0}
                            value={targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05)}
                            onChange={(os) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_os: os, target: yo + om + os + yt });
                            }}
                            className="p-1 text-xs bg-slate-50 border border-slate-200 rounded text-center w-16 text-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <NumberInput
                            min={0}
                            value={targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02)}
                            onChange={(yt) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              setTargetTKU({ ...targetTKU, target_yt: yt, target: yo + om + os + yt });
                            }}
                            className="p-1 text-xs bg-slate-50 border border-slate-200 rounded text-center w-16 text-slate-900 font-bold"
                          />
                        </td>"""

new_table_tku = """                      {/* Target TKU Row */}
                      <tr>
                        <td className="p-2.5 font-black text-red-700 uppercase text-[10px]">Target TKU</td>
                        <td {...getTkuCellProps(0, 0)} className={`p-1 text-center ${getTkuCellProps(0, 0).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85)}
                            onChange={(yo) => {
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_yo: yo, target: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td {...getTkuCellProps(0, 1)} className={`p-1 text-center ${getTkuCellProps(0, 1).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08)}
                            onChange={(om) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_om: om, target: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td {...getTkuCellProps(0, 2)} className={`p-1 text-center ${getTkuCellProps(0, 2).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05)}
                            onChange={(os) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const yt = targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02);
                              setTargetTKU({ ...targetTKU, target_os: os, target: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>
                        <td {...getTkuCellProps(0, 3)} className={`p-1 text-center ${getTkuCellProps(0, 3).className}`}>
                          <NumberInput
                            min={0}
                            value={targetTKU.target_yt ?? Math.trunc((targetTKU.target ?? 0) * 0.02)}
                            onChange={(yt) => {
                              const yo = targetTKU.target_yo ?? Math.trunc((targetTKU.target ?? 0) * 0.85);
                              const om = targetTKU.target_om ?? Math.trunc((targetTKU.target ?? 0) * 0.08);
                              const os = targetTKU.target_os ?? Math.trunc((targetTKU.target ?? 0) * 0.05);
                              setTargetTKU({ ...targetTKU, target_yt: yt, target: yo + om + os + yt });
                            }}
                            className="p-1 w-full h-full text-xs bg-transparent outline-none border-none text-center text-slate-900 font-bold"
                          />
                        </td>"""

if old_table_tku in content:
    content = content.replace(old_table_tku, new_table_tku)
else:
    print("WARNING: Could not find old_table_tku")

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

