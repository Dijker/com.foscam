'use strict';

const Homey = require('homey');

const Mail = require('/lib/Mail');

const refreshDeviceInterval = 1000 * 60; // 1 minute

class Device extends Homey.Device {

    /*
    |---------------------------------------------------------------------------
    | Error message
    |---------------------------------------------------------------------------
    |
    | Log an error message to the console, prepended by the device name.
    |
    */

    error () {
        console.log.bind(this, `✕ ${this.getName()}`).apply(this, arguments);
    }

    /*
    |---------------------------------------------------------------------------
    | Success message
    |---------------------------------------------------------------------------
    |
    | Log a success message to the console, prepended by the device name.
    |
    */

    success () {
        console.log.bind(this, `✓ ${this.getName()}`).apply(this, arguments);
    }

    /*
    |---------------------------------------------------------------------------
    | Initiate
    |---------------------------------------------------------------------------
    |
    | This method is called when a device is initiated.
    |
    */

    async onInit () {

        // Register capability listeners
        this._registerCapabilityListeners();

        // Set motionCommand if not set
        await this._setMotionCommand();

        // Get device data as soon as device is loaded
        this._getDeviceData();

        // Start camera data refresh timer
        this._deviceDataTimer = setInterval( () => {
            this._getDeviceData();
        }, refreshDeviceInterval);

        this.success(`initiated`);
    }

    /*
    |---------------------------------------------------------------------------
    | Settings changed
    |---------------------------------------------------------------------------
    |
    | This method is called when the device settings are changed.
    | It logs all the changed keys, including the old- and new value.
    |
    | The camera is updated afterwards.
    |
    */

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

    /*
    |---------------------------------------------------------------------------
    | Deleted
    |---------------------------------------------------------------------------
    |
    | This method is called when a device is deleted.
    | It logs a success message, confirming the deletion of the device.
    |
    */

    onDeleted () {
        clearInterval(this._deviceDataTimer);

        this.success(`deleted`);
    }

    /*
    |---------------------------------------------------------------------------
    | Get device data
    |---------------------------------------------------------------------------
    |
    | This method is fetching the data from the camera, and updates all
    | the device settings, capabilities etc.
    |
    */

    _getDeviceData () {
        let data = this.getData();
        data.motionCommand = this.motionCommand;

        Homey.app.getDeviceData(data)
            .then( result => {
                this.setAvailable();

                // Set device settings
                this._setDeviceSettings(result);

                // Set store values
                this.setStoreValue('imageSetting', result.imageSetting);
                this.setStoreValue('mirrorAndFlipSetting', result.mirrorAndFlipSetting);
                this.setStoreValue('motionDetectConfig', result.motionDetectConfig);
                this.setStoreValue('productAllInfo', result.productAllInfo);
                this.setStoreValue('PTZPresetPointList', this._formatPresetPointList(result.PTZPresetPointList));

                // Image capabilities
                this.setCapabilityValue('brightness', Number(result.imageSetting.brightness));
                this.setCapabilityValue('contrast', Number(result.imageSetting.contrast));
                this.setCapabilityValue('hue', Number(result.imageSetting.hue));
                this.setCapabilityValue('saturation', Number(result.imageSetting.saturation));
                this.setCapabilityValue('sharpness', Number(result.imageSetting.sharpness));

                // Mirror and flip capabilities
                this.setCapabilityValue('flip', Boolean(Number(result.mirrorAndFlipSetting.isFlip)));
                this.setCapabilityValue('mirror', Boolean(Number(result.mirrorAndFlipSetting.isMirror)));

            }).catch( err => {
                this.setUnavailable(err.message);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Update device settings
    |---------------------------------------------------------------------------
    |
    | This method is used to update the device settings.
    |
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

    /*
    |---------------------------------------------------------------------------
    | Update motion detect configuration
    |---------------------------------------------------------------------------
    |
    | This method is used to update the motion detect configuration of the device.
    |
    */

    setMotionDetectConfig (data) {
        let store   = this.getStoreValue('motionDetectConfig');
        let devData = this.getData();

        devData.motionCommand = this.motionCommand;

        return Homey.app.setMotionDetectConfig(devData, store, data)
            .then( result => {
                this.setStoreValue('motionDetectConfig', result);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Update motion command
    |---------------------------------------------------------------------------
    |
    | This method is used to update the motion command.
    |
    */

    async _setMotionCommand () {
        if (this.getStoreValue('motionCommand') === null) {

            Homey.app.checkMotionCommand(this.getData())
                .then( () => {
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

    /*
    |---------------------------------------------------------------------------
    | API functions
    |---------------------------------------------------------------------------
    |
    | These functions are supported by the device.
    |
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
            .then( () => {
                this.setCapabilityValue('brightness', Number(value));
            });
    }

    async setContrast (value) {
        this.success(`contrast set to \`${value}\``);

        return Homey.app.sendCommand('setContrast', this.getData(), { constrast: Number(value) }) // <-- Typo in API
            .then( () => {
                this.setCapabilityValue('contrast', Number(value));
            });
    }

    async setFlipView (value) {
        this.success(`flip view set to \`${value}\``);

        let bool = Boolean(Number(value));

        return Homey.app.sendCommand('flipVideo', this.getData(), { isFlip: bool ? 1 : 0 })
            .then( () => {
                this.setCapabilityValue('flip', bool);
            });
    }

    async setHue (value) {
        this.success(`hue set to \`${value}\``);

        return Homey.app.sendCommand('setHue', this.getData(), { hue: Number(value) })
            .then( () => {
                this.setCapabilityValue('hue', Number(value));
            });
    }

    async setMirrorView (value) {
        this.success(`mirror view set to \`${value}\``);

        let bool = Boolean(Number(value));

        return Homey.app.sendCommand('mirrorVideo', this.getData(), { isMirror: bool ? 1 : 0 })
            .then( () => {
                this.setCapabilityValue('mirror', bool);
            });
    }

    async setSaturation (value) {
        this.success(`saturation set to \`${value}\``);

        return Homey.app.sendCommand('setSaturation', this.getData(), { saturation: Number(value) })
            .then( () => {
                this.setCapabilityValue('saturation', Number(value));
            });
    }

    async setSharpness (value) {
        this.success(`sharpness set to \`${value}\``);

        return Homey.app.sendCommand('setSharpness', this.getData(), { sharpness: Number(value) })
            .then( () => {
                this.setCapabilityValue('sharpness', Number(value));
            });
    }

    async takeSnapshot () {
        this.success('taking snapshot');

        return Homey.app.getSnapshot(this.getData())
            .then( result => {

                let buffer = Buffer.from(result);
                let sendEmail = false;

                // Send email if setting 'mail_after_snapshot' is true
                if (Homey.ManagerSettings.get('after_snapshot')) {
                    sendEmail = Boolean(Number(Homey.ManagerSettings.get('after_snapshot')));
                }

                this._onSnapshotBuffer(buffer);

                if (sendEmail) {
                    this._mail = new Mail();
                    return this._mail.send(this.getName(), buffer);
                }
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Format preset point list
    |---------------------------------------------------------------------------
    |
    | This method is used to format the preset list for the dropdown.
    |
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

    /*
    |---------------------------------------------------------------------------
    | Register capability listeners
    |---------------------------------------------------------------------------
    |
    | This method registers all capability listeners.
    |
    */

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