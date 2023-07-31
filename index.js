// 1. Imports
const express = require('express');
const multer = require('multer');
const { auth, requiresAuth } = require('express-openid-connect');
const { sendEmails } = require('./server/api');
const { processContacts } = require('./server/utils');
const { uploadToDb } = require('./server/uploadToDb');
const { addContact, deleteContact } = require('./server/dataToDb');
require('dotenv').config();

// 2. Initialization
const app = express();
const apiRouter = express.Router();
const appRouter = express.Router();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

// 3. Middleware Definitions
app.use(express.json());

console.log("hi",process.env.ISSUER);

// API key middleware for API routes
const API_KEY = process.env.CUSTOM_API_KEY;
const apiKeyMiddleware = (req, res, next) => {
  const reqKey = req.get('x-api-key');
  if (reqKey && reqKey === API_KEY) {
    next();
  } else {
    res.status(403).json({error: "Invalid or missing API key"});
  }
};

// Auth0 Config and Middleware
const auth0Config = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: 'http://localhost:3000',
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: 'https://dev-clacle02vxe1wjq2.eu.auth0.com'
};
appRouter.use(auth(auth0Config)); // Apply Auth0 middleware to appRouter

// 4. Routes
// API Routes
apiRouter.post('/addContact', apiKeyMiddleware, addContact);
apiRouter.delete('/deleteContact/:contactId', apiKeyMiddleware, deleteContact);

// App Routes
appRouter.post("/contacts", requiresAuth(), async (req, res) => {
  const { templateId } = req.body;
  try {
    const emailGroups = await processContacts(99);
    for (let group of emailGroups) {
      await sendEmails(group, templateId);
    }
    res.json(emailGroups);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching contacts" });
  }
});

appRouter.post('/upload', requiresAuth(), upload.single('contacts-upload'), (req, res) => {
  uploadToDb(req.file.path);
  res.send('File uploaded successfully');
});

appRouter.get('/profile', requiresAuth(), (req, res) => {
  res.send("hi there");
});

// Attach routers to main app
app.use('/api', apiRouter);
app.use('/', appRouter);

// Serve static files from public directory
app.use(express.static('public'));

// 5. Catch all other routes
app.all("*", (req, res, next) => {
  console.log(`Received a ${req.method} request on ${req.originalUrl}`);
  next();
});

// 6. Server Listen
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
