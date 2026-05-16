const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = xlsx.readFile(
    path.join(__dirname, 'boxify_chatbot_dataset_v2.xlsx')
);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

fs.writeFileSync(
    path.join(__dirname, 'dataset.json'),
    JSON.stringify(data, null, 2),
    'utf8'
);

console.log('تم تحويل الداتاست بنجاح!');