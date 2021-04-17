if (process.argv.findIndex(arg => arg === '--help' || arg === '-h') !== -1) {
  console.log('--sheetId: google sheet id (required)');
  console.log('--worksheet: worksheet (required)');
  console.log('--npm: path to npm binary (if not available in path directly) [optional]');

  process.exit(0);
  return;
}

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { spawn } = require('child_process');

const credentials = require('./google_service_account_creds.json');

const getParameter = (param, defaultValue) => {
  const paramIndex = process.argv.findIndex(arg => arg === param);
  const valueIndex = paramIndex + 1;

  return paramIndex === -1
    ? defaultValue
    : process.argv[valueIndex];
};

const sheetId = getParameter('--sheetId');
const worksheetTitle = getParameter('--worksheet');
const npmPath = getParameter('--npm', 'npm');

if (!sheetId || !worksheetTitle) {
  console.log('You must pass --sheetId and --worksheet');
  process.exit(1);

  return;
}

const doc = new GoogleSpreadsheet(sheetId);

const addSheet = async (doc, title) => {
  const headerValues = ['when', 'ping', 'download', 'upload', 'isp', 'host', 'sponsor', 'location', 'country', 'serverId'];

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
    results.data.server.id,
  ]);
};

run();
