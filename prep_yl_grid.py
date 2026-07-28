import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

# Add imports
imports = """import { useSimpleGrid } from "./useSimpleGrid";
import { GridSelectionToolbar } from "./GridSelectionToolbar";"""
content = content.replace('import { User, Activity, Map, MapPin', imports + '\\nimport { User, Activity, Map, MapPin')

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)
