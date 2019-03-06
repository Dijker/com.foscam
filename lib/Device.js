'use strict';

const Homey = require('homey');

const Api  = require('./../lib/Api.js');
const Mail = require('./../lib/Mail.js');

class Device extends Homey.Device {

    async onInit ()
    {
        this.log('Initiating device');

        let stg = this.getSettings();

        this._api    = new Api(stg);
        this._mail   = new Mail();
        this._driver = this.getDriver();

        // Start polling camera settings every minute
        this.intervalGetAllDeviceSettings = setInterval( async () => {
            this.getAllDeviceSettings();
        }, 60000);

        try {

            this.registerCapabilityListeners();
            this.getAllDeviceSettings(true);

        } catch (err) {
            this.error(err.message);
        }
    }

    async onSettings (oldObj, newObj, cKeys)
    {
        this.log('Settings changed, updating device');
        this._api = new Api(newObj);

        try {
            await this.setMotionDetectConfig(newObj);
        } catch (err) {
            this._api = new Api(oldObj);
            throw new Error(err.message);
        }
    }

    onDeleted ()
    {
        clearInterval(this.intervalGetAllDeviceSettings);

        this.log('Device is deleted successfully!');
    }

    // Update device settings
    async getAllDeviceSettings (log = false)
    {
        if (log) {
            this.log('Updating device settings');
        }

        try {
            await this.getImageSetting();
            await this.getMirrorAndFlipSetting();
            await this.getMotionDetectConfig();
            await this.getPTZPresetPointList();
            await this.setAvailable();

        } catch (err) {
            console.log(err);
            this.setUnavailable(err.message);
        }
    }

    // Get color attributes of video
    async getImageSetting ()
    {
        return await this.sendCommand('getImageSetting')
            .then( result => {
                delete result.result;

                this.setStoreValue('imageSetting', result);
                this.setCapabilityValue('brightness', Number(result.brightness)).catch(this.error);
                this.setCapabilityValue('contrast',   Number(result.contrast)).catch(this.error);
                this.setCapabilityValue('hue',        Number(result.hue)).catch(this.error);
                this.setCapabilityValue('saturation', Number(result.saturation)).catch(this.error);
                this.setCapabilityValue('sharpness',  Number(result.sharpness)).catch(this.error);
            });
    }

    // Get mirror and flip attribute of video
    async getMirrorAndFlipSetting ()
    {
        return await this.sendCommand('getMirrorAndFlipSetting')
            .then( result => {
                delete result.result;

                this.setStoreValue('mirrorAndFlipSetting', result);
                this.setCapabilityValue('flip',   Boolean(Number(result.isFlip)));
                this.setCapabilityValue('mirror', Boolean(Number(result.isMirror)));
            });
    }

    // Get motion dection configuration
    async getMotionDetectConfig ()
    {
        return await this.sendCommand('getMotionDetectConfig')
            .then( result => {
                delete result.result;

                this.setStoreValue('motionDetectConfig', result);
                this.setSettings({
                    motion_detect_isenable: result.isEnable,
                    motion_detect_sensitivity: result.sensitivity
                });
            });
    }

    // Get Pan–Tilt–Zoom preset point list
    async getPTZPresetPointList ()
    {
        return await this.sendCommand('getPTZPresetPointList')
            .then( result => {
                delete result.result;
                delete result.cnt;

                let presets = [];

                Object.keys(result).forEach(key => {

                    if (typeof result[key] !== 'undefined' ){
                        let presetName = result[key];
                        let presetId = key[key.length - 1];

                        presets.push({
                            name: presetName,
                            description:  'Preset #' + presetId
			});
                    }
                });

                this.setStoreValue('PTZPresetPointList', presets);
            });
    }

    // PTZ goto preset point
    async ptzGotoPresetPoint (args)
    {
        let presetName = args.ptz_preset_point.name;

        this.log('PTZ goto point: ' + presetName);

        return await this.sendCommand('ptzGotoPresetPoint', { name: presetName });

    }

    // Reboot system
    async rebootDevice ()
    {
        this.log('Rebooting device');

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

    // Set motion dection configuration
    async setMotionDetectConfig (settings)
    {
        let config = this.getStoreValue('motionDetectConfig');

        if (settings.motion_detect_isenable) {
            config.isEnable = settings.motion_detect_isenable;
        }

        if (settings.motion_detect_sensitivity) {
            config.sensitivity = settings.motion_detect_sensitivity;
        }

        return await this.sendCommand('setMotionDetectConfig', config)
            .then( result => {
                this.setStoreValue('motionDetectConfig', config);
            }).catch( err => {
                throw new Error(err.message);
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

                let buffer = Buffer.from(result);
                let sendEmail = true;

                // Send email if setting 'mail_after_snapshot' is true
                if (Homey.ManagerSettings.get('mail_after_snapshot')) {
                    sendEmail = Boolean(Number(Homey.ManagerSettings.get('mail_after_snapshot')));
                }

                if (sendEmail) {
                    this._mail.send(this.getName(), buffer);
                }

                this._onSnapshotBuffer(buffer);

            }).catch( err => {
                this.error(err);
                throw new Error(err.message);
            });
    }

    // Send command to API
    async sendCommand (cmd, options)
    {
        return await this._api.get(cmd, options);
    }

    // Snapshot buffer and trigger snapshot taken
    _onSnapshotBuffer(buffer)
    {
        let img = new Homey.Image('jpg');

        img.setBuffer(buffer);
        img.register()
            .then( () => {
                this._driver.snapshotTrigger.trigger(this, {
                    snapshot_token: img
                });
            }).catch(this.error);
    }

    // Register capability listeners
    registerCapabilityListeners ()
    {
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
    }
};

module.exports = Device;