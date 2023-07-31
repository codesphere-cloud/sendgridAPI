require("dotenv").config();
const sgMail = require('@sendgrid/mail');

// const listId = `${config.LIST_ID}`


//Send Email to Contacts
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Set your SendGrid API key

// This function takes an array of email addresses and sends an email to each of them
const sendEmails = async (emailAddresses, templateId) => {
    let personalizationsArray = emailAddresses.map(email => {
        return { to: [{ email: email }] };
    });

    const msg = {
        from: 'support@codesphere.com',
        subject: 'Hello from Codesphere',
        template_id: templateId,
        // html: `<p>${emailText}</p>`,
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



module.exports = { sendEmails }

