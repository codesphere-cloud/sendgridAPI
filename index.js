const express = require('express');
const { getContactsLink, downloadAndDecompress, sendEmails } = require('./server/api');
const { processContacts } = require('./server/utils');
const app = express();
const port = 3000;

app.get("/contacts", async (req, res) => {
    try {
      const contactsUrl = await getContactsLink();
      await downloadAndDecompress(contactsUrl);
      const emailGroups = await processContacts(2);

      // Send emails to each group
      for (let group of emailGroups) {
        const emailAddresses = group.map(contact => contact.email); // Assuming each contact object has an 'email' field
        await sendEmails(emailAddresses);
      }

      res.json(emailGroups);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching contacts" });
    }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.use(express.static('public'));
