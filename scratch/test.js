const fs = require('fs');
const DATA_BUNDLE = require('./api/data-bundle.js');
const chatCode = fs.readFileSync('./api/chat.js', 'utf8');

// We want to extract buildPengurusSummary and ensureDataLoaded
eval(chatCode.replace(/module\.exports =.*/is, ''));

function test() {
  const data = ensureDataLoaded();
  const summary = buildPengurusSummary();
  fs.writeFileSync('test_output.txt', summary);
  console.log("Summary length: " + summary.length);
  console.log("Pengurus defined: " + (typeof data.pengurus));
  console.log("Has pengurusInti: " + (!!data.pengurus.pengurusInti));
  if(data.pengurus.pengurusInti) {
    console.log("Length of pengurusInti: " + data.pengurus.pengurusInti.length);
  }
}

test();
