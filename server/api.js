require("dotenv").config();
const axios = require('axios');
const config = require('./config');
const zlib = require('zlib');
const fs = require("fs");
const path = require("path");
const sgMail = require('@sendgrid/mail');

const sendGridEndpoint = `${config.SENDGRID_CONTACTS_ENDPOINT}`
// const listId = `${config.LIST_ID}`


//Get Link for Get Request

const fetchContacts = async (listId) => {
    try{
        console.log("Fetching contacts Url GET link")
        const response = await axios.post(sendGridEndpoint, {
            "list_ids": [
                listId
            ],
            "file_type": "json",
            "max_file_size": 1000
        },
            {
            headers: {
                "Authorization":`Bearer ${process.env.SENDGRID_API_KEY}`,
                "Accept":"application/json",
                "Content-Type": "application/json"
            }
        });
        return response.data;
    }
    catch(error){
        console.error(`Error fetching contacts ${error}`)
        throw error;
    }
};


// Make the get request and poll until status === ready

const pollForContactsUrl = async (url, interval, maxAttempts) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            console.log("Polling for contacts...")
            let response = await axios.get(url, {
                headers: {
                    "Authorization":`Bearer ${process.env.SENDGRID_API_KEY}`,
                    "Accept":"application/json",
                    "Content-Type": "application/json"
                }
            });

            if (response.data.status === 'ready') {
                return response.data;
            }
        } catch (error) {
            console.error(`Error while polling for contacts: ${error}`);
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Max attempts exceeded while polling for contacts');
};


// Retrieve contacts link

const getContactsLink = async (listId) => {
    try{
        const initialReq = await fetchContacts(listId);
        const contactsEndpoint = initialReq._metadata.self;

        const contactsExport = await pollForContactsUrl(contactsEndpoint,1000,5);
        const contactsUrl = contactsExport.urls;

        return contactsUrl;
    }
    catch(error){
        console.error(`Error downloading contacts ${error}`)
        throw error;
    }
}

//Download JSON file

const downloadAndDecompress = (contactsUrl) => {
  return new Promise((resolve, reject) => {
    axios({
      method: "get",
      url: contactsUrl,
      responseType: "stream",
    })
      .then((response) => {
        console.log("Writing JSON");

        const filePath = path.join(__dirname, 'data', 'contacts.json');
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on("finish", function () {
          console.log("Data written to contacts.json");
          resolve(); // Resolve the promise when writing is complete
        });

        writer.on("error", function (err) {
          console.error("Error writing data to contacts.json:", err);
          reject(err); // Reject the promise if there is an error
        });
      })
      .catch((error) => {
        console.error("Error downloading contacts:", error);
        reject(error); // Reject the promise if there is an error
      });
  });
};


//Send Email to Contacts
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Set your SendGrid API key

// This function takes an array of email addresses and sends an email to each of them
const sendEmails = async (emailAddresses, emailText) => {
    let personalizationsArray = emailAddresses.map(email => {
        return { to: [{ email: email }] };
    });

    const msg = {
        from: 'support@codesphere.com',
        subject: 'Hello from Codesphere',
        text: emailText,
        html: `<p>${emailText}</p>`,
        personalizations: personalizationsArray,
    };

    try {
        await sgMail.send(msg);
        console.log('Emails sent successfully');
    } catch (error) {
        console.error('Error sending emails:', error);
        throw error;
    }
};



module.exports = { fetchContacts, getContactsLink, downloadAndDecompress, sendEmails }

