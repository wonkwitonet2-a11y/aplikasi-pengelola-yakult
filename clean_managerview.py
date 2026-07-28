import re

with open("src/components/ManagerView.tsx", "r") as f:
    lines = f.readlines()

def comment_out_line(line_num):
    idx = line_num - 1
    if not lines[idx].strip().startswith("//"):
        lines[idx] = "// " + lines[idx]

to_remove = [
    740, 741, 742, 743, 744, 745, 746, 747, 748, 756, 792, 840,
    1086, 1243, 1290, 1291, 1292, 1393, 1493, 1494, 1495, 1620,
    1666, 1674, 1681, 1690
]

for l in to_remove:
    pass

