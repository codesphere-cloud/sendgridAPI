const express = require('express');
const app = express();
const port = 3000;

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { sendEmails } = require('./server/api');
const { processContacts } = require('./server/utils');
const { uploadToDb } = require('./server/uploadToDb');
const { auth } = require('express-openid-connect');

require('dotenv').config();

const config = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: 'http://localhost:3000',
  clientID: 'AZY64CKKQV1BPbDfyxb02eJeZAjyFNWK',
  issuerBaseURL: 'https://dev-clacle02vxe1wjq2.eu.auth0.com'
};

app.use(auth(config));

app.use(express.json());
app.use(express.static('public'));

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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
