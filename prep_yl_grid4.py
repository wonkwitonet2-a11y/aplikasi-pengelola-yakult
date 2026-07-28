import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# Replace the GridSelectionToolbar insertion
toolbar_target = """              <div className="border-l-4 border-indigo-600 pl-3 flex flex-col md:flex-row md:items-center justify-between gap-2">"""
toolbar_insertion = """              <div className="border-l-4 border-indigo-600 pl-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                {isEditRealisasi && (
                  <GridSelectionToolbar 
                    selection={realisasiGridSelection}
                    onCopy={handleRealisasiGridCopy}
                    onPaste={handleRealisasiGridPaste}
                    onClear={handleRealisasiGridClear}
                  />
                )}"""
content = content.replace(toolbar_target, toolbar_insertion)

# Replace the table headers for BB
header_target = """<th colSpan={4} className="p-1 text-center border-r border-slate-700 text-indigo-400 bg-indigo-950/30">IB</th>
                            <th rowSpan={2} className="p-2 text-center text-rose-400 border-l border-slate-700">BB</th>"""
header_replacement = """<th colSpan={4} className="p-1 text-center border-r border-slate-700 text-indigo-400 bg-indigo-950/30">IB</th>
                            {isEditRealisasi ? (
                              <th colSpan={4} className="p-1 text-center border-r border-slate-700 text-rose-400 bg-rose-950/30">BB</th>
                            ) : (
                              <th rowSpan={2} className="p-2 text-center text-rose-400 border-l border-slate-700">BB</th>
                            )}"""
content = content.replace(header_target, header_replacement)

# Replace the second row headers for BB
subheader_target = """<th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                          </tr>"""
subheader_replacement = """<th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                            {isEditRealisasi && (
                              <>
                                <th className="p-1 text-center">YO</th><th className="p-1 text-center">OM</th><th className="p-1 text-center">OS</th><th className="p-1 text-center border-r border-slate-700">YT</th>
                              </>
                            )}
                          </tr>"""
content = content.replace(subheader_target, subheader_replacement)


# Now modify the tbody block
# We need to grab the tbody rendering logic
import sys

tbody_pattern = re.compile(r'(const renderCell = \(field: string, v: number, className: string\) => \{.*?)return \(\s*<tr key=\{d\}', re.DOTALL)
match = tbody_pattern.search(content)

if not match:
    print("Could not find renderCell pattern")
    sys.exit(1)

old_render_block = match.group(1)

new_render_block = """const rIdx = d - 1;
                            const renderCell = (field: string, v: number, className: string, cIdx: number) => {
                              if (isEditRealisasi) {
                                return (
                                  <td {...getRealisasiCellProps(rIdx, cIdx)} className={className.replace("font-bold", "font-normal")}>
                                    <input type="number" min="0" value={v||""} onChange={(e) => editChange(field, parseInt(e.target.value)||0)} className="w-8 text-[10px] border border-slate-300 rounded p-0.5 text-center outline-none focus:ring-1 focus:ring-indigo-500" />
                                  </td>
                                );
                              }
                              return <td className={className}>{v || "-"}</td>;
                            };
                            const renderBbCell = () => {
                              if (isEditRealisasi) {
                                return (
                                  <>
                                    {renderCell('bb_yo', bb_yo, "p-1.5 text-center text-rose-700 bg-rose-50/50", 24)}
                                    {renderCell('bb_om', bb_om, "p-1.5 text-center text-rose-700 bg-rose-50/50", 25)}
                                    {renderCell('bb_os', bb_os, "p-1.5 text-center text-rose-700 bg-rose-50/50", 26)}
                                    {renderCell('bb_yt', bb_yt, "p-1.5 text-center font-bold text-rose-900 border-r border-slate-200 bg-rose-100", 27)}
                                  </>
                                );
                              }
                              return <td className="p-1.5 text-center text-rose-700 bg-rose-50/50 font-bold">{bb || "-"}</td>;
                            };
                            """

content = content.replace(old_render_block, new_render_block)

# And now inject cIdx in all renderCell calls inside the return (<tr>...</tr>) block
# Let's do a quick regex on `{renderCell('xxx', xxx, "...")}`

def repl_render(m):
    field = m.group(1)
    # find index in realisasiFields
    fields = [
      "rmh_yo", "rmh_om", "rmh_os", "rmh_yt",
      "psr_yo", "psr_om", "psr_os", "psr_yt",
      "skh_yo", "skh_om", "skh_os", "skh_yt",
      "ktr_yo", "ktr_om", "ktr_os", "ktr_yt",
      "tk_yo",  "tk_om",  "tk_os",  "tk_yt",
      "ib_yo",  "ib_om",  "ib_os",  "ib_yt",
      "bb_yo",  "bb_om",  "bb_os",  "bb_yt",
      "pb_p", "pb_s", "apk_plg", "apk_botol",
      "f_plg", "f_rk", "f_ra", "f_rb"
    ]
    if field in fields:
        idx = fields.index(field)
        return f"{{renderCell('{field}', {m.group(2)}, {m.group(3)}, {idx})}}"
    return m.group(0)

# The pattern is `{renderCell('field', val, "class")}`
pattern2 = re.compile(r"\{renderCell\('([^']+)',([^,]+),([^}]+)\)\}")
content = pattern2.sub(repl_render, content)

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
print("Success")

