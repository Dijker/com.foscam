'use strict';

const Homey = require('homey');

const Nodemailer = require('nodemailer');

class Mail extends Homey.SimpleClass {

    async send (deviceName, image)
    {
        this.deviceName = deviceName || null;
        this.image = image || null;

        let d = new Date();

        let host   = Homey.ManagerSettings.get('mail_host');
        let port   = Homey.ManagerSettings.get('mail_port');
        let from   = Homey.ManagerSettings.get('mail_from');
        let sendas = Homey.ManagerSettings.get('mail_send_as');
        let username  = Homey.ManagerSettings.get('mail_username');
        let password  = Homey.ManagerSettings.get('mail_password');
        let recipient = Homey.ManagerSettings.get('mail_recipient');

        if (!host || !port || !from || !recipient) {
            throw new Error(Homey.__('error.configure_smtp_settings'));
        }

        let transOptions = {
            host: host,
            port: port,
            secure: false,
            connectionTimeout: 5000
        };

        if (port === 465) {
            transOptions.secure = true;
        }

        if (username !== '' && password !== '') {
            transOptions.auth = {
                user: username,
                pass: password
            };
        }

        var transporter = Nodemailer.createTransport(transOptions);

        let mailOptions = {
            from: '"Foscam Camera" <' + from + '>',
            to: recipient,
            subject: 'Snapshot from ' + this.deviceName,
            text: 'Snapshot taken ' + d.toLocaleString(),
            attachments: [{
                content: this.image,
                filename: 'snapshot-' + d.getMilliseconds() + '.jpg'
            }]
        };

        if (sendas === 'attachment') {
            mailOptions.html = 'See snapshot in attachment.';
        } else {
            mailOptions.html = 'Snapshot taken ' + d.toLocaleString() + '<br /><img src="cid:snapshot@foscam.camera"/>';
            mailOptions.attachments[0].cid = 'snapshot@foscam.camera';
        }

        transporter.sendMail(mailOptions);
        this.log('Email send to ' + recipient);

        return await true;
    }
};

module.exports = Mail;