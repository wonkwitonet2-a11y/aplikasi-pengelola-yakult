import re
import os

for file in ["src/components/ManagerSeragamView.tsx", "src/components/YLSeragamView.tsx"]:
    with open(file, "r") as f:
        c = f.read()
    
    # ManagerSeragamView
    c = c.replace('bg-white rounded-xl', 'bg-white dark:bg-slate-900 rounded-xl')
    c = c.replace('bg-slate-50 border-b', 'bg-slate-50 dark:bg-slate-800 border-b')
    c = c.replace('bg-slate-50 border-t', 'bg-slate-50 dark:bg-slate-800 border-t')
    c = c.replace('text-slate-800', 'text-slate-800 dark:text-slate-100')
    c = c.replace('text-slate-700', 'text-slate-700 dark:text-slate-300')
    c = c.replace('text-slate-600', 'text-slate-600 dark:text-slate-400')
    c = c.replace('text-slate-500', 'text-slate-500 dark:text-slate-400')
    c = c.replace('bg-slate-100', 'bg-slate-100 dark:bg-slate-800')
    c = c.replace('border-slate-200', 'border-slate-200 dark:border-slate-700')
    
    # Text input colors
    c = c.replace('bg-white border', 'bg-white dark:bg-slate-900 border')
    c = c.replace('bg-amber-50/50', 'bg-amber-50/50 dark:bg-amber-900/20')
    c = c.replace('bg-blue-50/50', 'bg-blue-50/50 dark:bg-blue-900/20')
    c = c.replace('bg-red-50/50', 'bg-red-50/50 dark:bg-red-900/20')
    c = c.replace('text-amber-800', 'text-amber-800 dark:text-amber-400')
    c = c.replace('text-blue-800', 'text-blue-800 dark:text-blue-400')
    c = c.replace('text-red-800', 'text-red-800 dark:text-red-400')
    c = c.replace('text-amber-700/70', 'text-amber-700/70 dark:text-amber-400/70')
    c = c.replace('text-blue-700/70', 'text-blue-700/70 dark:text-blue-400/70')
    c = c.replace('text-red-700/70', 'text-red-700/70 dark:text-red-400/70')

    # YLSeragamView specific
    c = c.replace('bg-[#Fdfbf7]', 'bg-[#Fdfbf7] dark:bg-slate-950')
    c = c.replace('bg-white rounded-2xl', 'bg-white dark:bg-slate-900 rounded-2xl')
    c = c.replace('bg-white rounded-[32px]', 'bg-white dark:bg-slate-900 rounded-[32px]')
    c = c.replace('border-slate-100', 'border-slate-100 dark:border-slate-800')
    c = c.replace('bg-blue-50 text-blue-600', 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400')
    
    with open(file, "w") as f:
        f.write(c)
