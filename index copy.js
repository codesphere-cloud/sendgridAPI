const express = require('express');
const app = express();
const port = 3000;

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { sendEmails } = require('./server/api');
const { processContacts } = require('./server/utils');
const { uploadToDb } = require('./server/uploadToDb');
const { addContact, deleteContact } = require('./server/dataToDb');
const { auth } = require('express-openid-connect');
const { data } = require('autoprefixer');

require('dotenv').config();

app.use(express.json());


const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'jpZxydgA364qhx2q2WgTDvwGtTC6fPUnIk776OKklCWgu4eSL4pnGvYZ3NVCpMa05k6uJeBaQ5dCZKpHK3JL1P2dPti5i8V11QXx',
  baseURL: 'http://localhost:3000',
  clientID: 'AZY64CKKQV1BPbDfyxb02eJeZAjyFNWK',
  issuerBaseURL: 'https://dev-clacle02vxe1wjq2.eu.auth0.com'
};

// Define your API key
const API_KEY = 'lIHrlOLmNLuJwKv0qdPWEzdRehFLLSK7z8NNdTTRNQwB9O3G3t';

// Create middleware to validate API key
const apiKeyMiddleware = (req, res, next) => {
  const reqKey = req.get('x-api-key');
  if (reqKey && reqKey === API_KEY) {
    next();
  } else {
    res.status(403).json({error: "Invalid or missing API key"});
  }
};

app.post('/api/addContact', apiKeyMiddleware, async (req, res) => { 
  addContact(req, res);
});

app.delete('/api/deleteContact/:contactId', apiKeyMiddleware, async (req, res) => {
  deleteContact(req, res);
});



app.use(auth(auth0Config));

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
