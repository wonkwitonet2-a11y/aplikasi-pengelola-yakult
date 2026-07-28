import sys

def remove_function(file_path, func_name):
    with open(file_path, 'r') as f:
        lines = f.readlines()
        
    start_idx = -1
    for i, line in enumerate(lines):
        if f"const {func_name} =" in line or f"function {func_name}(" in line or f"const [{func_name}," in line or f"const [ {func_name} ," in line or f"const [ {func_name}," in line or f"const [{func_name} ," in line:
            start_idx = i
            break
            
    if start_idx == -1:
        return
        
    # for state declarations (one-liners usually)
    if "useState" in lines[start_idx]:
        # just remove this line
        del lines[start_idx]
        with open(file_path, 'w') as f:
            f.writelines(lines)
        return

    # find where block starts '{'
    brace_count = 0
    in_block = False
    end_idx = start_idx
    for i in range(start_idx, len(lines)):
        line = lines[i]
        for char in line:
            if char == '{':
                brace_count += 1
                in_block = True
            elif char == '}':
                brace_count -= 1
        
        if in_block and brace_count == 0:
            end_idx = i
            break
            
    # delete from start_idx to end_idx
    if in_block and brace_count == 0:
        del lines[start_idx:end_idx+1]
        with open(file_path, 'w') as f:
            f.writelines(lines)

