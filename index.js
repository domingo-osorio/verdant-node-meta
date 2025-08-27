import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets.readonly",
});

// Create client instance for auth
const client = await auth.getClient();

// Instance of Google Sheets API
const googleSheets = google.sheets({ version: "v4", auth: client });

const spreadsheetId = "1CYUtwmohGaHqxSZJZ_E0raAd-vRcANpfBPAaT6ovTPw";

// Get metadata about spreadsheet
const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
});

// Read rows from spreadsheet
const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Stats!A:ZZZ",
});

console.log(getRows.data);
