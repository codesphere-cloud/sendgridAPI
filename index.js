const express = require('express');
const { sendEmails } = require('./server/api');
const { processContacts } = require('./server/utils');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadToDb } = require('./server/uploadToDb');

app.use(express.json());

app.all("*", (req, res, next) => {
  console.log(`Received a ${req.method} request on ${req.originalUrl}`);
  next();
});


app.post("/contacts", async (req, res) => {
  console.log(req.body);

  const { templateId } = req.body;

  try {
    const emailGroups = await processContacts(99);

    // Send emails to each group
    for (let group of emailGroups) {
        await sendEmails(group, templateId);
    }

    res.json(emailGroups);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching contacts" });
  }
});

app.post('/upload', upload.single('contacts-upload'), (req, res) => {

  uploadToDb(req.file.path);

  res.send('File uploaded successfully');

});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
