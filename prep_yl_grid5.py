import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# Fix the total footer colSpan for BB
footer_target = '<td className="p-2 text-center border-l border-slate-700 text-rose-300">{totBb}</td>'
footer_replacement = """{isEditRealisasi ? (
                              <td colSpan={4} className="p-2 text-center border-l border-slate-700 text-rose-300">{totBb}</td>
                            ) : (
                              <td className="p-2 text-center border-l border-slate-700 text-rose-300">{totBb}</td>
                            )}"""
content = content.replace(footer_target, footer_replacement)

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
print("Success")
