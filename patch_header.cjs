const fs = require('fs');
let code = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

const regex = /\{\/\* Header \/ Month & Mode Selection Card \*\/\}.*?\{\/\* Grid Table Card \*\/\}/s;

const newHeader = `{/* Header / Month & Mode Selection Card */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧩</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase leading-none">Breakdown & Realisasi Harian</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Input rencana harian (BD) & realisasi harian per Yakult Lady</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Month Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] font-bold text-slate-600">Bulan:</span>
                    <input
                      type="month"
                      value={selectedBreakdownMonth}
                      onChange={(e) => {
                        setSelectedBreakdownMonth(e.target.value);
                        fetchBreakdownPlan(e.target.value);
                      }}
                      className="p-1 text-xs font-bold bg-slate-50 rounded-lg border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                    <button
                      onClick={() => setGridSubMode("BD")}
                      className={\`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer \${
                        gridSubMode === "BD" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }\`}
                    >
                      Breakdown (BD)
                    </button>
                    <button
                      onClick={() => setGridSubMode("R")}
                      className={\`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer \${
                        gridSubMode === "R" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }\`}
                    >
                      Realisasi (R)
                    </button>
                  </div>

                  {/* Manual Pembagi */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-700">Pembagi:</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={
                        activeGridMap && Object.keys(activeGridMap).length > 0
                          ? activeGridMap[Object.keys(activeGridMap)[0]]?.pembagiTanggal ?? 25
                          : 25
                      }
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleGlobalPembagiChange(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-10 p-0.5 text-xs font-extrabold text-center bg-white border border-slate-300 rounded-md text-slate-900 outline-none"
                    />
                  </div>
                  
                  {/* Percentages */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">vs Tgt:</span>
                      <span className={monthlyGridStats.pctTgt >= 100 ? "text-emerald-600" : "text-rose-600"}>
                        {monthlyGridStats.pctTgt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    </div>
                    <div className="w-px h-3 bg-slate-300" />
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">vs BL:</span>
                      <span className={monthlyGridStats.pctBL >= 100 ? "text-emerald-600" : "text-rose-600"}>
                        {monthlyGridStats.pctBL.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    </div>
                    <div className="w-px h-3 bg-slate-300" />
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">vs TL:</span>
                      <span className={monthlyGridStats.pctTL >= 100 ? "text-emerald-600" : "text-rose-600"}>
                        {monthlyGridStats.pctTL.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    </div>
                  </div>

                  {/* Save */}
                  <button
                    onClick={() => handleSaveBreakdownPlan(true)}
                    disabled={isBreakdownSaving}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                  >
                    {isBreakdownSaving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Simpan...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Simpan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {breakdownMsg && (
                <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 animate-pulse text-center">
                  {breakdownMsg}
                </p>
              )}
            </div>

            {/* Grid Table Card */}`;

code = code.replace(regex, newHeader);
fs.writeFileSync('src/components/ManagerView.tsx', code);
console.log("Patched header");
