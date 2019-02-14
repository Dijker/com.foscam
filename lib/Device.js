'use strict';

const Homey = require('homey');

const Api = require('./../lib/Api.js');
const Nodemailer = require('nodemailer');

class Device extends Homey.Device {

    async onInit ()
    {
        this.log('Initiating device');

        this._driver = this.getDriver();

        try {
            // Capabilities
            this.registerCapabilityListener('brightness', (value) => {
                return this.setBrightness(value);
            });

            this.registerCapabilityListener('contrast', (value) => {
                return this.setContrast(value);
            });

            this.registerCapabilityListener('flip', (value) => {
                return this.setFlipView(value);
            });

            this.registerCapabilityListener('hue', (value) => {
                return this.setHue(value);
            });

            this.registerCapabilityListener('mirror', (value) => {
                return this.setMirrorView(value);
            });

            this.registerCapabilityListener('saturation', (value) => {
                return this.setSaturation(value);
            });

            this.registerCapabilityListener('sharpness', (value) => {
                return this.setSharpness(value);
            });

            // Flow card: Triggers
            new Homey.FlowCardTriggerDevice('snapshot')
                .register();

            await this.updateCapabilities();

            // Start polling camera for information
            this.intervalUpdateDevice = setInterval( async () => {
                await this.updateCapabilities();
            }, 300000);

        } catch (err) {
            this.log(err.message);
        }
    }

    async onSettings (oldSettingsObj, newSettingsObj, changedKeysArr)
    {
        this.log('Settings changed, testing connection');

        let api = new Api(newSettingsObj);

        return await api.get('getImageSetting')
            .catch( err => {
                throw new Error(err.message);
            });
    }

    onDeleted ()
    {
        clearInterval(this.intervalUpdateDevice);
        this.log('Device is deleted');
    }

    async updateCapabilities ()
    {
        this.log('Updating capabilities');

        return await Promise.all([
            await this.getImageSetting(),
            await this.getMirrorAndFlipSetting()
        ]);
    }

    // Get color attributes of video
    async getImageSetting ()
    {
        this.log('Get image setting');

        return await this.sendCommand('getImageSetting')
            .then( result => {
                this.setCapabilityValue('brightness', Number(result.brightness));
                this.setCapabilityValue('contrast',   Number(result.contrast));
                this.setCapabilityValue('hue',        Number(result.hue));
                this.setCapabilityValue('saturation', Number(result.saturation));
                this.setCapabilityValue('sharpness',  Number(result.sharpness));
            });
    }

    // Get mirror and flip attribute of video
    async getMirrorAndFlipSetting ()
    {
        this.log('Get mirror and flip attribute');

        return await this.sendCommand('getMirrorAndFlipSetting')
            .then( result => {
                this.setCapabilityValue('flip',   Boolean(Number(result.isFlip)));
                this.setCapabilityValue('mirror', Boolean(Number(result.isMirror)));
            });
    }

    // Reboot system
    async rebootDevice ()
    {
        this.log('Reboot device');

        return await this.sendCommand('rebootSystem');
    }

    // Set brightness of video
    async setBrightness (value)
    {
        this.log('Set brightness to ' + value);

        return await this.sendCommand('setBrightness', { brightness: Number(value) })
            .then( result => {
                this.setCapabilityValue('brightness', Number(value));
            });
    }

    // Set contrast of video
    async setContrast (value)
    {
        this.log('Set contrast to ' + value);

        return await this.sendCommand('setContrast', { constrast: Number(value) }) // <-- Typo in API
            .then( result => {
                this.setCapabilityValue('contrast', Number(value));
            });
    }

    // Set flip view
    async setFlipView (value)
    {
        this.log('Set flip view to ' + value);

        let bool = Boolean(Number(value));

        return await this.sendCommand('flipVideo', { isFlip: bool ? 1 : 0 })
            .then( result => {
                this.setCapabilityValue('flip', bool);
            });
    }

    // Set hue of video
    async setHue (value)
    {
        this.log('Set hue to ' + value);

        return await this.sendCommand('setHue', { hue: Number(value) })
            .then( result => {
                this.setCapabilityValue('hue', Number(value));
            });
    }

    // Set mirrored view
    async setMirrorView (value)
    {
        this.log('Set mirror view to ' + value);

        let bool = Boolean(Number(value));

        return await this.sendCommand('mirrorVideo', { isMirror: bool ? 1 : 0 })
            .then( result => {
                this.setCapabilityValue('mirror', bool);
            });
    }

    // Set saturation of video
    async setSaturation (value)
    {
        this.log('Set saturation to ' + value);

        return await this.sendCommand('setSaturation', { saturation: Number(value) })
            .then( result => {
                this.setCapabilityValue('saturation', Number(value));
            });
    }

    // Set sharpness of video
    async setSharpness (value)
    {
        this.log('Set sharpness to ' + value);

        return await this.sendCommand('setSharpness', { sharpness: Number(value) })
            .then( result => {
                this.setCapabilityValue('sharpness', Number(value));
            });
    }

    // Take a snapshot
    async takeSnapshot ()
    {
        this.log('Taking snapshot');

        return await this.sendCommand('snapPicture2')
            .then( result => {
                let d = new Date();

                let buffer = Buffer.from(result);
                let host   = Homey.ManagerSettings.get('mail_host');
                let port   = Homey.ManagerSettings.get('mail_port');
                let from   = Homey.ManagerSettings.get('mail_from');
                let sendas = Homey.ManagerSettings.get('mail_send_as');
                let username  = Homey.ManagerSettings.get('mail_username');
                let password  = Homey.ManagerSettings.get('mail_password');
                let recipient = Homey.ManagerSettings.get('mail_recipient');

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

                let transporter = Nodemailer.createTransport(transOptions);

                let mailOptions = {
                    from: '"Foscam Camera" <' + from + '>',
                    to: recipient,
                    subject: 'Snapshot ' + d.toLocaleString(),
                    text: 'Snapshot taken ' + d.toLocaleString(),
                    attachments: [{
                        content: buffer,
                        filename: 'snapshot-' + d.getMilliseconds() + '.jpg'
                    }]
                };

                if (sendas === 'attachment') {
                    mailOptions.html = 'See snapshot in attachment.';
                } else {
                    mailOptions.html = 'Snapshot taken ' + d.toLocaleString() + '<br /><img src="cid:snapshot@foscam.camera"/>';
                    mailOptions.attachments[0].cid = 'snapshot@foscam.camera';
                }

                let sendInfo = transporter.sendMail(mailOptions);

                this._driver.triggerSnapshotFlow(this);

            }).catch( err => {
                console.log(err);
            });
    }

    // Send command to API
    async sendCommand (cmd, options)
    {
        let stg = this.getSettings();
        let api = new Api(stg);

        return await api.get(cmd, options);
    }

};

module.exports = Device;