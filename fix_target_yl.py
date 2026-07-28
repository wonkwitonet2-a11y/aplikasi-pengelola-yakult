import re

with open("src/components/ManagerView.tsx", "r") as f:
    content = f.read()

# Replace Target YL inputs classes
old_yl_1 = """                                className="w-full p-1.5 text-xs bg-red-50/50 border border-red-200 rounded outline-none text-center font-bold text-slate-900 focus:border-red-500" """
new_yl_1 = """                                className="w-full h-full p-1.5 text-xs bg-transparent outline-none border-none text-center font-bold text-slate-900" """

content = content.replace(old_yl_1.strip(), new_yl_1.strip())

old_yl_2 = """                                className="w-full p-1.5 text-xs bg-purple-50/50 border border-purple-200 rounded outline-none text-center font-bold text-slate-900 focus:border-purple-500" """
new_yl_2 = """                                className="w-full h-full p-1.5 text-xs bg-transparent outline-none border-none text-center font-bold text-slate-900" """

content = content.replace(old_yl_2.strip(), new_yl_2.strip())

old_yl_3 = """                                className="w-full p-1.5 text-xs bg-teal-50/50 border border-teal-200 rounded outline-none text-center font-bold text-slate-900 focus:border-teal-500" """
new_yl_3 = """                                className="w-full h-full p-1.5 text-xs bg-transparent outline-none border-none text-center font-bold text-slate-900" """

content = content.replace(old_yl_3.strip(), new_yl_3.strip())

with open("src/components/ManagerView.tsx", "w") as f:
    f.write(content)

