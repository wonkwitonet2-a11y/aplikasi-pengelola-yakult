import re

with open("src/components/ManagerSeragamView.tsx", "r") as f:
    content = f.read()

# Replace the calendar section with input text fields for each uniform.
new_schedule_ui = """
        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-400"></div>
              Yakult Mangga (Kuning)
            </h3>
            <p className="text-xs text-amber-700/70 mb-3">Masukkan tanggal (pisahkan dengan koma), contoh: 1, 8, 15, 22</p>
            <input 
              type="text"
              value={getDatesString("yellow")}
              onChange={(e) => handleDatesChange("yellow", e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Contoh: 1, 8, 15"
            />
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              Yakult Light (Biru)
            </h3>
            <p className="text-xs text-blue-700/70 mb-3">Masukkan tanggal (pisahkan dengan koma), contoh: 2, 9, 16, 23</p>
            <input 
              type="text"
              value={getDatesString("blue")}
              onChange={(e) => handleDatesChange("blue", e.target.value)}
              className="w-full bg-white border border-blue-300 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: 2, 9, 16"
            />
          </div>

          <div className="bg-red-50/50 p-4 rounded-xl border border-red-200">
            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              Yes Everyday (Merah)
            </h3>
            <p className="text-xs text-red-700/70 mb-3">Masukkan tanggal (pisahkan dengan koma), contoh: 3, 10, 17, 24</p>
            <input 
              type="text"
              value={getDatesString("red")}
              onChange={(e) => handleDatesChange("red", e.target.value)}
              className="w-full bg-white border border-red-300 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Contoh: 3, 10, 17"
            />
          </div>
        </div>
"""

# I need to rewrite the entire component to be safe.
