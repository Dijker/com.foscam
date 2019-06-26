'use strict';

const Homey = require('homey');

const Nodemailer = require('nodemailer');

class Mail {

    async send (deviceName, image) {
        this.deviceName = deviceName || 'camera';
        this.image = image || null;

        let d = new Date();

        let host = Homey.ManagerSettings.get('host');
        let port = Homey.ManagerSettings.get('port');
        let from = Homey.ManagerSettings.get('from');
        let sendas = Homey.ManagerSettings.get('send_as');
        let username = Homey.ManagerSettings.get('username');
        let password = Homey.ManagerSettings.get('password');
        let recipient = Homey.ManagerSettings.get('recipient');

        if (!host || !port || !from || !recipient) {
            console.log(`✕ Email error: SMTP settings not configured.`);
            throw Error(Homey.__('error.configure_smtp_settings'));
        }

        let transOptions = {
            host: host,
            port: port,
            secure: (port === 465 ? true : false),
            connectionTimeout: 5000
        };

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
        console.log(`✓ ${this.deviceName} snapshot send to ${recipient}`);

        return await true;
    }
};

module.exports = Mail;