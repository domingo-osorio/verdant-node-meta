import { google } from "googleapis";
import * as fs from 'node:fs';
import * as dotenv from './libs/env.js';

const { SPREADSHEET_ID_2: spreadsheetId, OUTPUT_FILE_2, JWT } = process.env;

const auth = new google.auth.GoogleAuth({ keyFile: JWT, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
const client = await auth.getClient();
const google_sheets = google.sheets({ version: "v4", auth: client });
const data = (await google_sheets.spreadsheets.get({
     spreadsheetId, 
     fields:"sheets/data/rowData/values(dataValidation(condition(type,values)),userEnteredValue,effectiveValue),sheets/properties/title",
})).data.sheets;

fs.writeFileSync(OUTPUT_FILE_2, JSON.stringify(data, null, 2));
