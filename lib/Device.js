'use strict';

const Homey = require('homey');

const Mail = require('./../lib/Mail');

const refreshDeviceInterval = 1000 * 60; // 1 minute

class Device extends Homey.Device {

    error () {
        console.log.bind(this, `✕ ${this.getName()}`).apply(this, arguments);
    }

    success () {
        console.log.bind(this, `✓ ${this.getName()}`).apply(this, arguments);
    }

    // =========================================================================

    /**
     * Events
     */

    async onInit () {

        // Set motionCommand if not set
        await this._setMotionCommand();

        // Register capability listeners
        this._registerCapabilityListeners();

        // Get device data as soon as device is loaded
        this._getDeviceData();

        // Start camera data refresh timer
        this._deviceDataTimer = setInterval( () => {
            this._getDeviceData();
        }, refreshDeviceInterval);

        this.success(`initiated`);
    }

    onSettings (oldSettings, newSettings, changedKeys, callback) {
        changedKeys.forEach( (name) => {
            this.success(`setting \`${name}\` set \`${oldSettings[name]}\` => \`${newSettings[name]}\``);
        });

        // Update camera settings
        this.setMotionDetectConfig(newSettings)
            .then( result => {
                this.success(`settings updated`);
                callback(null, result);
            }).catch( err => {
                this.error(`settings update failed: ${err.message}`);
                callback(err.message);
            });
    }

    onDeleted () {
        clearInterval(this._deviceDataTimer);

        this.success(`deleted`);
    }

    // =========================================================================

    /**
     * Retrieve functions
     */

    _getDeviceData () {
        let data = this.getData();
        data.motionCommand = this.motionCommand;

        Homey.app.getDeviceData(data)
            .then( result => {
                this.setAvailable();
                this._setDeviceSettings(result);
                this._setStoreValues(result);
                this._setCapabilityValues(result);
            }).catch( err => {
                this.setUnavailable(err.message);
            });
    }

    // =========================================================================

    /**
     * Update functions
     */

    _setDeviceSettings (data) {
        let sensitivity = 'sensitivity';

        if (this.motionCommand === '1') {
            sensitivity = 'sensitivity1';
        }

        this.pt_support = Boolean(Number(data.productAllInfo.ptFlag));

        this.setSettings({
            firmware: data.devInfo.firmwareVer,
            hardware: data.devInfo.hardwareVer,
            mac: data.devInfo.mac.toString(16).match(/.{1,2}/g).reverse().join(':'),
            model: data.devInfo.productName,

            motion_detect_isenable: data.motionDetectConfig.isEnable,
            motion_detect_sensitivity: data.motionDetectConfig[sensitivity],

            sdcard_support: (data.productAllInfo.sdFlag    === '0' ? '✖' : '✔'),
            pt_support    : (data.productAllInfo.ptFlag    === '0' ? '✖' : '✔'),
            rs485_support : (data.productAllInfo.rs485Flag === '0' ? '✖' : '✔'),
            onvif_support : (data.productAllInfo.onvifFlag === '0' ? '✖' : '✔'),
            p2p_support   : (data.productAllInfo.p2pFlag   === '0' ? '✖' : '✔'),
            wps_support   : (data.productAllInfo.wpsFlag   === '0' ? '✖' : '✔'),
            zoom_support  : (data.productAllInfo.zoomFlag  === '0' ? '✖' : '✔')
        });
    }

    _setStoreValues (data) {
        this.setStoreValue('imageSetting', data.imageSetting);
        this.setStoreValue('mirrorAndFlipSetting', data.mirrorAndFlipSetting);
        this.setStoreValue('motionDetectConfig', data.motionDetectConfig);
        this.setStoreValue('productAllInfo', data.productAllInfo);
        this.setStoreValue('PTZPresetPointList', this._formatPresetPointList(data.PTZPresetPointList));
    }

    _setCapabilityValues (data) {
        // Image capabilities
        this.setCapabilityValue('brightness', Number(data.imageSetting.brightness));
        this.setCapabilityValue('contrast', Number(data.imageSetting.contrast));
        this.setCapabilityValue('hue', Number(data.imageSetting.hue));
        this.setCapabilityValue('saturation', Number(data.imageSetting.saturation));
        this.setCapabilityValue('sharpness', Number(data.imageSetting.sharpness));

        // Mirror and flip capabilities
        this.setCapabilityValue('flip', Boolean(Number(data.mirrorAndFlipSetting.isFlip)));
        this.setCapabilityValue('mirror', Boolean(Number(data.mirrorAndFlipSetting.isMirror)));
    }

    setMotionDetectConfig (data) {
        let store   = this.getStoreValue('motionDetectConfig');
        let devData = this.getData();

        devData.motionCommand = this.motionCommand;

        return Homey.app.setMotionDetectConfig(devData, store, data)
            .then( result => {
                this.setStoreValue('motionDetectConfig', result);
            });
    }

    async _setMotionCommand () {
        if (this.getStoreValue('motionCommand') === null) {

            Homey.app.checkMotionCommand(this.getData())
                .then( result => {
                    this.setStoreValue('motionCommand', '0');
                    this.success(`set motion command to \`0\``);
                    this.motionCommand = '0';
                }).catch( err => {
                    this.setStoreValue('motionCommand', '1');
                    this.success(`set motion command to \`1\``);
                    this.motionCommand = '1';
                });
        } else {
            this.motionCommand = this.getStoreValue('motionCommand');
            this.success(`motion command is \`${this.motionCommand}\``);
        }
    }

    // =========================================================================

    /**
     * Actions
     */

    async ptzGotoPresetPoint (args) {
        let presetName = args.ptz_preset_point.name;

        if (this.pt_support) {
            this.success(`goto PTZ point: \`${presetName}\``);
        } else {
            this.error(`does not support Pan/Tilt commands`);
            throw Error(`Camera does not support Pan/Tilt`);
        }

        return Homey.app.sendCommand('ptzGotoPresetPoint', this.getData(), { name: presetName });
    }

    async rebootSystem () {
        this.success(`rebooting`);

        return Homey.app.sendCommand('rebootSystem', this.getData());
    }

    async setBrightness (value) {
        this.success(`brightness set to \`${value}\``);

        return Homey.app.sendCommand('setBrightness', this.getData(), { brightness: Number(value) })
            .then( result => {
                this.setCapabilityValue('brightness', Number(value));
            });
    }

    async setContrast (value) {
        this.success(`contrast set to \`${value}\``);

        return Homey.app.sendCommand('setContrast', this.getData(), { constrast: Number(value) }) // <-- Typo in API
            .then( result => {
                this.setCapabilityValue('contrast', Number(value));
            });
    }

    async setFlipView (value) {
        this.success(`flip view set to \`${value}\``);

        let bool = Boolean(Number(value));

        return Homey.app.sendCommand('flipVideo', this.getData(), { isFlip: bool ? 1 : 0 })
            .then( result => {
                this.setCapabilityValue('flip', bool);
            });
    }

    async setHue (value) {
        this.success(`hue set to \`${value}\``);

        return Homey.app.sendCommand('setHue', this.getData(), { hue: Number(value) })
            .then( result => {
                this.setCapabilityValue('hue', Number(value));
            });
    }

    async setMirrorView (value) {
        this.success(`mirror view set to \`${value}\``);

        let bool = Boolean(Number(value));

        return Homey.app.sendCommand('mirrorVideo', this.getData(), { isMirror: bool ? 1 : 0 })
            .then( result => {
                this.setCapabilityValue('mirror', bool);
            });
    }

    async setSaturation (value) {
        this.success(`saturation set to \`${value}\``);

        return Homey.app.sendCommand('setSaturation', this.getData(), { saturation: Number(value) })
            .then( result => {
                this.setCapabilityValue('saturation', Number(value));
            });
    }

    async setSharpness (value) {
        this.success(`sharpness set to \`${value}\``);

        return Homey.app.sendCommand('setSharpness', this.getData(), { sharpness: Number(value) })
            .then( result => {
                this.setCapabilityValue('sharpness', Number(value));
            });
    }

    // =========================================================================

    /**
     * Formatting
     */

    _formatPresetPointList (list) {
        delete list.cnt;

        let presets = [];

        Object.keys(list).forEach(key => {
            if (typeof list[key] !== 'undefined' ){
                let presetName = list[key];
                let presetId = key[key.length - 1];

                presets.push({
                    name: presetName,
                    description: `Preset ${presetId}`
                });
            }
        });

        return presets;
    }

    // Take a snapshot
    async takeSnapshot () {
        this.success('taking snapshot');

        Homey.app.getSnapshot(this.getData())
            .then( result => {

                let buffer = Buffer.from(result);
                let sendEmail = true;

                // Send email if setting 'mail_after_snapshot' is true
                if (Homey.ManagerSettings.get('after_snapshot')) {
                    sendEmail = Boolean(Number(Homey.ManagerSettings.get('after_snapshot')));
                }

                if (sendEmail) {
                    this._mail = new Mail();
                    this._mail.send(this.getName(), buffer);
                }

                this._onSnapshotBuffer(buffer);

            }).catch( err => {
                this.error('takeSnapshot', err);
                throw err;
            });
    }

    // Snapshot buffer and trigger snapshot taken
    _onSnapshotBuffer(buffer) {
        let img = new Homey.Image('jpg');

        img.setBuffer(buffer);
        img.register()
            .then( () => {
                this._driver = this.getDriver();
                this._driver.snapshotTrigger.trigger(this, {
                    snapshot_token: img
                });
            }).catch( this.error );
    }

    // Register capability listeners
    _registerCapabilityListeners () {
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