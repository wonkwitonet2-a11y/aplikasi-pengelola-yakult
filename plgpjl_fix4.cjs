const fs = require('fs');
let content = fs.readFileSync('src/components/PlgPjlView.tsx', 'utf8');

const replacement = `
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{
        ok: boolean;
        ylList: YLLady[];
        pembagiManager: number;
        transactions: Transaction[];
      }>("/api/getPlgPjlData");

      if (res && res.ok) {
        if (res.ylList && res.ylList.length > 0) {
          const activeOnly = res.ylList.filter(y => !y.status || y.status === "Aktif");
          setActiveYlList(activeOnly);
        }
        setPembagi(res.pembagiManager || initialDivisor);
        setTransactions(res.transactions || []);
      }
    } catch (e) {
      console.error("Gagal mengambil data PLG/PJL", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isTkuDp1 = selectedArea === "TKU_DP1";

  // Get current active YL object`;

content = content.replace(
  /const loadData = async \(\) => \{\s*setLoading\(true\);\s*try \{\s*\/\/ Get current active YL object/g,
  replacement
);

fs.writeFileSync('src/components/PlgPjlView.tsx', content);
