import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

render_code = """
        {/* PRODUCT KNOWLEDGE TAB */}
        {activeTab === "product_knowledge" && <ProductKnowledgeView onBack={() => setActiveTab("beranda")} />}
"""

# Insert after TAB POTENSI VS TEMBUS block
search_str = """        {activeTab === "seragam" && <YLSeragamView onBack={() => setActiveTab("beranda")} />}"""

if search_str in content:
    content = content.replace(search_str, search_str + "\n" + render_code)
else:
    print("search_str not found")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
