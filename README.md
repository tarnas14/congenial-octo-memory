# just a interwebz tester

I wanted to test my internet speed connection and give it to my isp in a form of spreadsheet

## how to use

you need to setup a [service-account for a google project](https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=service-account), and download the credentials file

the credential file should be named `google_service_account_creds.json` and put in the root of this repo

remember to share the worksheet you want to use

pass 2 arguments - your google sheetId and worksheetTitle - if the worksheet does not exist, it will be created

e.g.
```
node ./index.js 14Vo4hRbXvtEZamzoM9gfYMpiybb9n-T9lI34ylNJZq myWorksheetTitle
```
