import re
with open("src/components/ManagerView.tsx", "r") as f:
    lines = f.readlines()

def print_range(start, end, desc):
    print(f"--- {desc} ---")
    for i in range(start-1, end):
        print(f"{i+1}: {lines[i].rstrip()}")
    print()

print_range(703, 704, "isSendingDP1 and dp1ResultModal")
print_range(738, 748, "mgtDate to mgtSaveMsg")
print_range(756, 756, "targetSavedMsg")
print_range(791, 792, "handleTargetGridSelectAll")
print_range(839, 840, "handleTkuGridSelectAll")
print_range(1085, 1102, "handleSendToDP1")
print_range(1242, 1273, "handleSaveManagerRealisasi")
print_range(1289, 1292, "motivasi states")
print_range(1392, 1466, "handleQuickEval")
print_range(1620, 1634, "handleResetData")
print_range(1665, 1710, "motivasi handlers")

