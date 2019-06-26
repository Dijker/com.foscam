'use strict';

const Homey = require('homey');

const Nodemailer = require('nodemailer');

module.exports = [
    {
        method: 'GET',
        path: '/logs',
        fn: function (args, callback) {
            const result = Homey.app.getLogs();
            callback(null, result);
        }
    },
    {
        method: 'GET',
        path: '/delete_logs',
        fn: function (args, callback) {
            const result = Homey.app.deleteLogs();
            callback(null, result);
        }
    },
    {
        method: 'PUT',
        path: '/verify_email_settings',
        fn: function (args, callback) {
            async function test () {

                let options = {
                    host: args.body.host,
                    port: Number(args.body.port),
                    secure: false,
                    connectionTimeout: 5000
                };

                if (args.body.port === 465) {
                    options.secure = true;
                }

                if (args.body.username !== '' && args.body.password !== '') {
                    options.auth = {
                        user: args.body.username,
                        pass: args.body.password
                    };
                }

                // Create transporter
                let transporter = Nodemailer.createTransport(options);

                return await transporter.verify();
            }

            // Do the test
            test()
                .then( result => {
                    callback(null, result);
                }).catch( err => {
                    console.log('verify_email_settings', err);

                    if (err.responseCode && Number(err.responseCode) === 535) {
                        callback(Homey.__('error.login'));
                    }

                    callback(Homey.__('error.request'));
                });
        }
    }
];