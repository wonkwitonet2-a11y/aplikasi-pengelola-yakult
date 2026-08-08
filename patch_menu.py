import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

menu_item = """
              <button
                onClick={() => setActiveTab("product_knowledge")}
                className="col-span-2 bg-rose-50 dark:bg-rose-900/20 p-3 sm:p-4 rounded-[24px] shadow-sm border border-rose-200 dark:border-rose-800 hover:border-rose-400 hover:shadow-md transition-all active:scale-95 group text-left flex flex-col justify-between h-20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">📚</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Product Knowledge</h3>
                </div>
              </button>
"""

# Insert after Potensi Tembus button
# Let's find </button> before Papan Attention
search_str = """                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Potensi Tembus</h3>
                  
                </div>
              </button>"""

if search_str in content:
    content = content.replace(search_str, search_str + "\n" + menu_item)
else:
    print("search_str not found")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
