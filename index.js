const express = require('express');
const { getContactsLink, downloadAndDecompress, sendEmails } = require('./server/api');
const { processContacts } = require('./server/utils');
const app = express();
const port = 3000;

app.use(express.json());

app.all("*", (req, res, next) => {
  console.log(`Received a ${req.method} request on ${req.originalUrl}`);
  next();
});

app.get("/contacts", async (req, res) => {

});

app.post("/contacts", async (req,res) => {
  console.log(req.body);

  const {listId , emailText} = req.body;
  console.log(listId);

  try {
    const contactsUrl = await getContactsLink(listId);
    await downloadAndDecompress(contactsUrl);
    const emailGroups = await processContacts(2);

    // Send emails to each group
    for (let group of emailGroups) {
      const emailAddresses = group.map(contact => contact.email); // Assuming each contact object has an 'email' field
      await sendEmails(emailAddresses, emailText);
    }

    res.json(emailGroups);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching contacts" });
  }
})

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
