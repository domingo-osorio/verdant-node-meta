import { google } from "googleapis";
import * as fs from 'node:fs';
import * as dotenv from './env.js';

const { SPREADSHEET_ID: spreadsheetId, OUTPUT_FILE, JWT } = process.env;

const auth = new google.auth.GoogleAuth({ keyFile: JWT, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
const client = await auth.getClient();
const google_sheets = google.sheets({ version: "v4", auth: client });
const meta_data = await google_sheets.spreadsheets.get({ auth, spreadsheetId });
const sheet_names = meta_data.data.sheets.map(x => x.properties.title);

let entries = await Promise.all(
    sheet_names.map(async x => {
        const sheet_data = await google_sheets.spreadsheets.values.get({ auth, spreadsheetId, range: x + "!A:ZZZ" });
        return [x, sheet_data.data.values];
    })
);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(Object.fromEntries(entries)));