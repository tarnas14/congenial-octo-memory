const { GoogleSpreadsheet } = require('google-spreadsheet');
const { spawn } = require('child_process');

const credentials = require('./google_service_account_creds.json');

const sheetId = process.argv[2];
const worksheetTitle = process.argv[3];

const doc = new GoogleSpreadsheet(sheetId);

const addSheet = async (doc, title) => {
  const headerValues = ['when', 'ping', 'download', 'upload', 'isp', 'host', 'sponsor', 'location', 'country'];

  const newSheet = await doc.addSheet({ title });
  await newSheet.setHeaderRow(headerValues);

  return newSheet
};

const testConnection = async () => new Promise((resolve, reject) => {
  const speedTest = spawn('npm', ['run', 'speed-test'], { cwd: __dirname });

  const stdout = [];
  const stderr = [];

  speedTest.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    stdout.push(data.toString());
  });

  speedTest.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
    stderr.push(data.toString());
  });

  speedTest.on('close', (code) => {
    if (code === 0) {
      const [_, resultsInJson] = stdout;
      const results = JSON.parse(resultsInJson);
      results.when = new Date();
      resolve(results);

      return;
    }

    reject(`Process exited with code ${code}`);
  });
});

const run = async () => {
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();

  const worksheet = doc.sheetsByTitle[worksheetTitle] || (await addSheet(doc, worksheetTitle));

  const results = await testConnection();
  await worksheet.addRow([
    `${results.when.toLocaleDateString()} ${results.when.toLocaleTimeString()}`,
    results.ping,
    results.data.speeds.download,
    results.data.speeds.upload,
    results.data.client.isp,
    results.data.server.host,
    results.data.server.sponsor,
    results.data.server.location,
    results.data.server.country,
  ]);
};

run();
