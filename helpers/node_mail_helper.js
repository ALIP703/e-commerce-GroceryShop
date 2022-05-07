var nodemailer = require('nodemailer');

var email = process.env.email;
var emailPassword = process.env.emailPassword;

module.exports = sendMail = (data) => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: '',//give email
                pass: ''//
            }
        });
        console.log(data);

        let mailOptions = {
            from: email ,
            to: data.recipient || '',
            bcc: data.bcc || '',
            subject: data.subject,
            text: data.message
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("error occured in mail sending"+error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        resolve()
    })
}