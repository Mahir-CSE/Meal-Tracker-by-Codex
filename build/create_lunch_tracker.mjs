import fs from "node:fs/promises";
import JSZip from "jszip";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/mahirahmedniloy/Documents/Codex/2026-05-01/i-want-to-create-a-lunch/outputs/lunch-tracker";
const outputPath = `${outputDir}/lunch_dinner_tracker.xlsx`;

const staff = [
  "Ahmed",
  "Mahir",
  "Nusrat",
  "Sadia",
  "Rafi",
  "Tanjim",
  "Farhana",
  "Imran",
  "Ayesha",
  "Karim",
];

const workbook = Workbook.create();
const tracker = workbook.worksheets.add("Daily Tracker");
const summary = workbook.worksheets.add("HR Summary");
const settings = workbook.worksheets.add("Settings");

const today = new Date();
today.setHours(0, 0, 0, 0);
const dates = Array.from({ length: 31 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return d;
});

settings.getRange("A1:C1").values = [["Work Status", "Lunch", "Dinner"]];
settings.getRange("A2:C3").values = [
  ["Work from Office", "Yes", "Yes"],
  ["Work from Home", "No", "No"],
];
settings.getRange("E1:F1").values = [["Meal Value", "Counted As"]];
settings.getRange("E2:F3").values = [
  ["Yes", 1],
  ["No", 0],
];

tracker.getRange("A1:G1").values = [["Date", "Employee", "Work Status", "Lunch", "Dinner", "Notes", "Row Key"]];

const rows = [];
for (const date of dates) {
  for (const name of staff) {
    rows.push([date, name, "Work from Office", null, null, "", null]);
  }
}

tracker.getRange(`A2:G${rows.length + 1}`).values = rows;
tracker.getRange(`D2:D${rows.length + 1}`).formulas = rows.map((_, i) => [
  `=IF($C${i + 2}="","",IF($C${i + 2}="Work from Home","No","Yes"))`,
]);
tracker.getRange(`E2:E${rows.length + 1}`).formulas = rows.map((_, i) => [
  `=IF($C${i + 2}="","",IF($C${i + 2}="Work from Home","No","Yes"))`,
]);
tracker.getRange(`G2:G${rows.length + 1}`).formulas = rows.map((_, i) => [
  `=TEXT($A${i + 2},"yyyy-mm-dd")&"|"&$B${i + 2}`,
]);

summary.getRange("A1").values = [["Lunch & Dinner Count Dashboard"]];
summary.getRange("A3:D3").values = [["Selected Date", dates[0], "Total Lunch", null]];
summary.getRange("A4:D4").values = [["", "", "Total Dinner", null]];
summary.getRange("D3").formulas = [[`=COUNTIFS('Daily Tracker'!$A:$A,$B$3,'Daily Tracker'!$D:$D,"Yes")`]];
summary.getRange("D4").formulas = [[`=COUNTIFS('Daily Tracker'!$A:$A,$B$3,'Daily Tracker'!$E:$E,"Yes")`]];
summary.getRange("A6:E6").values = [["Employee", "Work Status", "Lunch", "Dinner", "Notes"]];

for (let i = 0; i < staff.length; i++) {
  const r = i + 7;
  summary.getRange(`A${r}:A${r}`).values = [[staff[i]]];
  summary.getRange(`B${r}:B${r}`).formulas = [[`=IFERROR(INDEX('Daily Tracker'!$C:$C,MATCH(TEXT($B$3,"yyyy-mm-dd")&"|"&$A${r},'Daily Tracker'!$G:$G,0)),"")`]];
  summary.getRange(`C${r}:C${r}`).formulas = [[`=IFERROR(INDEX('Daily Tracker'!$D:$D,MATCH(TEXT($B$3,"yyyy-mm-dd")&"|"&$A${r},'Daily Tracker'!$G:$G,0)),"")`]];
  summary.getRange(`D${r}:D${r}`).formulas = [[`=IFERROR(INDEX('Daily Tracker'!$E:$E,MATCH(TEXT($B$3,"yyyy-mm-dd")&"|"&$A${r},'Daily Tracker'!$G:$G,0)),"")`]];
  summary.getRange(`E${r}:E${r}`).formulas = [[`=IFERROR(INDEX('Daily Tracker'!$F:$F,MATCH(TEXT($B$3,"yyyy-mm-dd")&"|"&$A${r},'Daily Tracker'!$G:$G,0)),"")`]];
}

summary.getRange("G3:H6").values = [
  ["Rule", "Result"],
  ["Work from Office", "Lunch = Yes, Dinner = Yes"],
  ["Work from Home", "Lunch = No, Dinner = No"],
  ["HR action", "Use totals in D3:D4 to order food"],
];

tracker.getRange("A1:G1").format = {
  bold: true,
  backgroundColor: "#1f4e79",
  fontColor: "#ffffff",
  horizontalAlignment: "center",
};
tracker.getRange(`A2:A${rows.length + 1}`).numberFormat = "yyyy-mm-dd";
tracker.getRange(`D2:E${rows.length + 1}`).format = { horizontalAlignment: "center" };
tracker.getRange(`G:G`).format = { fontColor: "#ffffff" };

summary.getRange("A1:H1").format = {
  bold: true,
  fontSize: 18,
  fontColor: "#1f4e79",
};
summary.getRange("A3:D4").format = {
  bold: true,
  backgroundColor: "#eaf3f8",
};
summary.getRange("D3:D4").format = {
  bold: true,
  fontSize: 16,
  horizontalAlignment: "center",
  backgroundColor: "#d9ead3",
};
summary.getRange("A6:E6").format = {
  bold: true,
  backgroundColor: "#1f4e79",
  fontColor: "#ffffff",
};
summary.getRange("A7:E16").format = {
  backgroundColor: "#f7f9fb",
};
summary.getRange("B3").numberFormat = "yyyy-mm-dd";

settings.getRange("A1:C1").format = {
  bold: true,
  backgroundColor: "#1f4e79",
  fontColor: "#ffffff",
};
settings.getRange("E1:F1").format = {
  bold: true,
  backgroundColor: "#1f4e79",
  fontColor: "#ffffff",
};

await fs.mkdir(outputDir, { recursive: true });

const check = await workbook.inspect({
  kind: "table",
  range: "HR Summary!A1:H16",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await workbook.render({ sheetName: "Daily Tracker", range: "A1:G24", scale: 1 });
await workbook.render({ sheetName: "HR Summary", range: "A1:H16", scale: 1 });
await workbook.render({ sheetName: "Settings", range: "A1:F6", scale: 1 });

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

const xlsxBytes = await fs.readFile(outputPath);
const zip = await JSZip.loadAsync(xlsxBytes);
const trackerXmlPath = "xl/worksheets/sheet1.xml";
let trackerXml = await zip.file(trackerXmlPath).async("string");
const validationXml = `<x:dataValidations count="1"><x:dataValidation type="list" allowBlank="0" sqref="C2:C${rows.length + 1}"><x:formula1>"Work from Office,Work from Home"</x:formula1></x:dataValidation></x:dataValidations>`;
trackerXml = trackerXml.replace(/<x:dataValidations[\s\S]*?<\/x:dataValidations>/, "");
trackerXml = trackerXml.replace("<x:pageMargins", `${validationXml}<x:pageMargins`);
zip.file(trackerXmlPath, trackerXml);
const patched = await zip.generateAsync({ type: "nodebuffer" });
await fs.writeFile(outputPath, patched);
console.log(`Saved ${outputPath}`);
