const xlsx = require("xlsx");
const { parse } = require("csv-parse/sync");

const parseFile = (buffer, originalname) => {
  const ext = originalname.split(".").pop().toLowerCase();

  if (ext === "csv") {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const columns = records.length > 0 ? Object.keys(records[0]) : [];
    return { columns, rows: records };
  }

  if (ext === "xlsx" || ext === "xls") {
    const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows };
  }

  throw new Error(`Unsupported file type: .${ext}`);
};

module.exports = { parseFile };
