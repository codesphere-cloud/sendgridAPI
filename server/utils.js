const fs = require('fs');
const ndjson = require('ndjson');

function chunkArray(array, chunkSize) {
    let results = [];
    while (array.length) {
        results.push(array.splice(0, chunkSize));
    }

    return results;
}

let data = [];
let emailGroups = [];

function processContacts(chunkSize) {
    return new Promise((resolve, reject) => {
      let data = [];

      console.log("creating array from JSON")
  
      fs.createReadStream('server/data/contacts.json')
        .pipe(ndjson.parse())
        .on('data', function (obj) {
          data.push(obj);
        })
        .on('end', function () {
          emailGroups = chunkArray(data, chunkSize);
          console.log("new data array", emailGroups);
          resolve(emailGroups); // Resolve the promise with emailGroups
        })
        .on('error', function (err) {
          reject(err); // Reject the promise if an error occurs
        });
    });
  }

module.exports = { processContacts }
