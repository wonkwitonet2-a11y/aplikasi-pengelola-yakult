import("xlsx").then(XLSX => {
  console.log(XLSX.utils ? "utils found" : "utils missing");
});
