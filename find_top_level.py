with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if stack:
            stack.pop()
            if not stack:
                print(f"Top-level brace closed at index {i}")
                line_no = content[:i].count('\n') + 1
                print(f"Line {line_no}: {content.split(chr(10))[line_no-1]}")
