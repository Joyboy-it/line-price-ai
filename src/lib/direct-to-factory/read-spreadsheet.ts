import { Readable } from 'stream';
import ExcelJS from 'exceljs';

function worksheetToRows(sheet: ExcelJS.Worksheet): string[][] {
  const rows: string[][] = [];
  const width = sheet.columnCount;
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const values: string[] = [];
    for (let c = 1; c <= width; c++) {
      values.push(row.getCell(c).text ?? '');
    }
    rows.push(values);
  }
  return rows;
}

/** Reads the first sheet of an .xlsx, or a UTF-8 .csv, as rows of text. */
export async function readSpreadsheet(buffer: Buffer, fileName: string): Promise<string[][]> {
  const extension = fileName.toLowerCase().split('.').pop();
  const workbook = new ExcelJS.Workbook();

  if (extension === 'xlsx') {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } else if (extension === 'csv') {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    await workbook.csv.read(Readable.from([text]), { map: (value: unknown) => value });
  } else {
    throw new Error('รองรับเฉพาะไฟล์ .xlsx หรือ .csv');
  }

  const sheet = workbook.worksheets[0];
  return sheet ? worksheetToRows(sheet) : [];
}
