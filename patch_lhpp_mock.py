with open("src/components/LhppRealisasiView.tsx", "r") as f:
    content = f.read()

import re

# Replace INITIAL_LHPP_ROWS and INITIAL_YLM_SUMMARY with dynamically generated zeros or just empty arrays
new_initial = """const INITIAL_LHPP_ROWS: LhppRow[] = [];
"""

content = re.sub(r'const INITIAL_LHPP_ROWS: LhppRow\[\] = \[.*?\];', new_initial, content, flags=re.DOTALL)

new_summary = """const INITIAL_YLM_SUMMARY: LhppYlmSummary = {
  pdmYlm: { yo: 0, om: 0, os: 0, yt: 0 },
  sisaYlm: { yo: 0, om: 0, os: 0, yt: 0 },
  botolRusak: 0
};"""

content = re.sub(r'const INITIAL_YLM_SUMMARY: LhppYlmSummary = \{.*?\n\};', new_summary, content, flags=re.DOTALL)

with open("src/components/LhppRealisasiView.tsx", "w") as f:
    f.write(content)
