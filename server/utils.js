const fs = require('fs');
const ndjson = require('ndjson');
const sqlite3 = require('sqlite3').verbose();

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

      const db = new sqlite3.Database('./server/data/contacts.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
        } else {
          console.log('Connected to the database.');
          const sql = `SELECT email FROM contacts`;

          db.all(sql, [], (err, rows) => {
            if (err) {
              console.error(err.message);
              reject(err);
            } else {
              const emailGroups = chunkArray(rows.map(row => row.email), chunkSize);
              console.log("new data array", emailGroups);
              resolve(emailGroups); // Resolve the promise with emailGroups
            }
          });
        }
      });
    });
  }

module.exports = { processContacts }
