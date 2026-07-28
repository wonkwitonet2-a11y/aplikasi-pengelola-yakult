import re

with open("src/components/AIChatBot.tsx", "r") as f:
    content = f.read()

content = re.sub(r'MessageSquare,\s*', '', content)
content = re.sub(r'HelpCircle,\s*', '', content)
content = re.sub(r'ArrowRight,\s*', '', content)
content = re.sub(r'TrendingUp,\s*', '', content)

with open("src/components/AIChatBot.tsx", "w") as f:
    f.write(content)
