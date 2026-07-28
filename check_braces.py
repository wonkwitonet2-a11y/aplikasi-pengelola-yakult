def check_braces(file_path):
    with open(file_path, "r") as f:
        content = f.read()
    
    stack = []
    for i, char in enumerate(content):
        if char == '{':
            stack.append(i)
        elif char == '}':
            if not stack:
                print(f"Extra closing brace at index {i}")
                # find line number
                line_no = content[:i].count('\n') + 1
                print(f"Line {line_no}: {content.split(chr(10))[line_no-1]}")
            else:
                stack.pop()
    
    if stack:
        print(f"Unmatched opening braces: {len(stack)}")
        for i in stack:
            line_no = content[:i].count('\n') + 1
            print(f"Line {line_no}: {content.split(chr(10))[line_no-1]}")

check_braces("src/components/ManagerView.tsx")
