import * as XLSX from "xlsx";

export const readExcelFile = async (filePath, filterFn = null) => {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Tell XLSX to start at row 5 (index 4) to get correct headers
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 4 });

    // Optional: trim keys to avoid spaces
    jsonData = jsonData.map((row) => {
      const cleaned = {};
      Object.keys(row).forEach((k) => {
        cleaned[k.trim()] = row[k];
      });
      return cleaned;
    });

    console.log("Available columns:", Object.keys(jsonData[0]));

    const result = filterFn ? jsonData.filter(filterFn) : jsonData;

    return result;
  } catch (error) {
    // alert("Can't read Excel file");
    console.error("Error reading Excel file:", error);
    return [];
  }
};
