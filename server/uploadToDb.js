const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

function uploadToDb(filePath) {

    let db = new sqlite3.Database('./server/data/contacts.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the database.');
    }
    );

    let sql = "INSERT INTO contacts (sendgrid_contact_id, email, first_name, last_name) VALUES (?, ?, ?, ?)";


    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {

            // Access the fields by their names in the CSV
            let email = row['EMAIL'];
            let firstName = row['FIRST_NAME'];
            let lastName = row['LAST_NAME'];
            let contactID = row['CONTACT_ID'];
            

            db.run(sql, [contactID, email, firstName, lastName], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            });
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
                console.log('Close the database connection.');
            });
        
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('File removed');
        });
    });
}


module.exports = { uploadToDb }