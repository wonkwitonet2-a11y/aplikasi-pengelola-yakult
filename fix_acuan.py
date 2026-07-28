import re

with open("src/components/YLView.tsx", "r") as f:
    content = f.read()

old_func = """  const isAllSectorsMatched = () => {
    return (
      isMatched("yo", totYo) &&
      isMatched("om", totOm) &&
      isMatched("os", totOs) &&
      isMatched("yt", totYt)
    );
  };"""

new_func = """  const isAllSectorsMatched = () => {
    const selectedDay = parseInt(selectedDate.split("-")[2], 10);
    const adminData = ylBreakdownRealisasi?.days?.[String(selectedDay)];
    
    const checkProd = (prodKey: "yo" | "om" | "os" | "yt") => {
      const adminTotal = (adminData as any)?.[prodKey] || 0;
      if (adminTotal === 0) return true; // allow if admin hasn't set
      return getSectorTotal(prodKey) === adminTotal;
    };

    return checkProd("yo") && checkProd("om") && checkProd("os") && checkProd("yt");
  };"""

if old_func in content:
    content = content.replace(old_func, new_func)
    print("Replaced logic")
else:
    print("Not found old_func")

with open("src/components/YLView.tsx", "w") as f:
    f.write(content)

