const sqlite3 = require('sqlite3').verbose();

function addContact(req, res) {
    // Check if the contact object is provided in the request body
    if (!req.body || !req.body.contact) {
        return res.status(400).json({ error: 'Contact data is missing in the request body.' });
    }

    // Deconstruct the contact and subgroupIds from the request body
    const { contact, subgroupIds } = req.body;

    // Validate the contact object
    const { sendgrid_contact_id, email, first_name, last_name } = contact;
    if (!sendgrid_contact_id || !email || !first_name || !last_name) {
        return res.status(400).json({ error: 'Some contact properties are missing.' });
    }

    // Open a connection to the database
    let db = new sqlite3.Database('./server/data/contacts.db', sqlite3.OPEN_READWRITE);

    // Prepare the SQL for inserting the contact
    let sql = 'INSERT INTO contacts (sendgrid_contact_id, email, first_name, last_name) VALUES (?, ?, ?, ?)';

    // Run the SQL query
    db.run(sql, [sendgrid_contact_id, email, first_name, last_name], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const contactId = this.lastID;

        // If subgroupIds were provided, associate the contact with each subgroup
        if (subgroupIds && Array.isArray(subgroupIds)) {
            const subgroupSql = 'INSERT INTO contact_subgroup (contact_id, subgroup_id) VALUES (?, ?)';

            // Iterate over each subgroupId
            subgroupIds.forEach(subgroupId => {
                db.run(subgroupSql, [contactId, subgroupId], function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                });
            });

            // Respond with a success message
            res.json({ message: `Contact and subgroup relationships have been created with contactId ${contactId}` });
        } else {
            // Respond with a success message
            res.json({ message: `Contact has been inserted with rowid ${contactId}` });
        }
    });

    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
    });
}

function deleteContact(req, res) {
    const contactId = req.params.contactId;

    if (!contactId) {
        return res.status(400).json({ error: 'Contact id is required.' });
    }

    let db = new sqlite3.Database('./server/data/contacts.db', sqlite3.OPEN_READWRITE);

    // Prepare the SQL for deleting the contact
    let sql = 'DELETE FROM contacts WHERE id = ?';

    // Run the SQL query
    db.run(sql, [contactId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Respond with a success message
        res.json({ message: `Contact with id ${contactId} has been deleted` });
    });

    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
    });
}


module.exports = { addContact, deleteContact }
