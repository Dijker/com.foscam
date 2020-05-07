'use strict';

const Homey = require('homey');

const Api = require('/lib/Api');

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
        this.success(`is initiating`);

        try{
            // migrate to sensor class
            if ((this.getClass() !== 'sensor')) {
                this.success('Migrating device to sensor class.');
                await this.setClass('sensor');
                const options = { excerpt: 'THE FOSCAM APP WAS MIGRATED TO A NEW VERSION. CHECK YOUR FLOWS! (sorry)' };
                const notification = new Homey.Notification(options);
                notification.register()
                    .catch(this.error);
            }

            // Define API object
            this.api = new Api(this.getData());

            // Define camera image
            this.image = new Homey.Image('jpg');

            // Device update timer
            this._deviceRefreshTimer = false;

            // Motion detect update timer
            this._motionDetectTimer = false;

            // Register capability listeners
            this._registerCapabilityListeners();

            // Set motionCommand if not set
            await this._setMotionCommand();

            // Get device data as soon as device is loaded
            await this._getDeviceData();

            // Configure device image
            await this._setDeviceImage();

            // Enable refresh timer
            this._setRefreshTimer(this.getSetting('refresh_interval'));

            // Enable or Disable motion detect timer
            this.motionDetectEnabled = this.hasCapability('alarm_motion') ? '1' : '0';
            await this.setSettings({ status_polling: this.motionDetectEnabled });
            this.motionDetectInterval = this.getSetting('status_polling_interval') || 1.5;
            this._setMotionDetectTimer();

        } catch (error) {
            this.error(error);
        }

    }

    /*
    |---------------------------------------------------------------------------
    | Configure device image
    |---------------------------------------------------------------------------
    |
    | This method sets the image sources and enables app view in
    | Homey v2.2.0 and newer.
    |
    */

    async _setDeviceImage () {
        if (this.image.setStream) {
            this.image.setStream(async (stream) => {
                return this.api.getStreamSnapshot()
                    .then (response => {
                        return response.pipe(stream);
                    });
            });
        } else {
            this.image.setBuffer( async () => {
                return await this.api.getBufferSnapshot();
            });
        }

        this.image.register()
            .then( () => {
                if (this.setCameraImage) {
                    return this.setCameraImage('front', 'snapshot', this.image);
                }
            }).catch(this.error);
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

    async onSettings (oldSettings, newSettings, changedKeys, callback) {
        try {
            changedKeys.forEach( name => {
                this.success(`setting \`${name}\` set \`${oldSettings[name]}\` => \`${newSettings[name]}\``);
            });

            // refresh interval changed
            if (changedKeys.includes('refresh_interval')) {
                this._setRefreshTimer(newSettings['refresh_interval']);
            }

            // motion detect settings changed
            if (changedKeys.includes('motion_detect_isenable') || changedKeys.includes('motion_detect_sensitivity')) {
                // Update camera settings
                await this.setMotionDetectConfig(newSettings);
            }

            // motion status polling interval changed
            if (changedKeys.includes('status_polling_interval')) {
                this.motionDetectInterval = newSettings['status_polling_interval'];
                this._setMotionDetectTimer();
            }

            // report success, because capability change takes longer than 5000ms.
            this.success(`settings updated`);
            callback(null, null);

            // motion status polling changed
            if (changedKeys.includes('status_polling')) {
                this.motionDetectEnabled = newSettings['status_polling'];
                if (this.motionDetectEnabled === '0' ) {
                    if (this.hasCapability('alarm_motion')) await this.removeCapability('alarm_motion').catch(this.error);
                } else {
                    await this.addCapability('alarm_motion').catch(this.error);
                }
                this.onInit();
            }

        } catch (error) {
            this.error(`settings update failed: ${error.message}`);
            callback(error.message);
        }
    }

    /*
    |---------------------------------------------------------------------------
    | Deleted
    |---------------------------------------------------------------------------
    |
    | This method is called when a device is deleted.
    |
    | It logs a success message, confirming the deletion of the device.
    |
    */

    onDeleted () {
        clearInterval(this._deviceRefreshTimer);
        clearInterval(this._motionDetectTimer);

        this.success(`deleted`);
    }

    /*
    |---------------------------------------------------------------------------
    | Get device data
    |---------------------------------------------------------------------------
    |
    | This method is fetching the data from the camera and updates all
    | the device settings, capabilities etc.
    |
    */

    async _getDeviceData () {
        try {
            this.setAvailable();

            const response = await this.api.getDeviceData(this.motionCommand);

            // Set device settings
            this._setDeviceSettings(response);

            // Set store values
            this.setStoreValue('imageSetting', response.imageSetting);
            this.setStoreValue('mirrorAndFlipSetting', response.mirrorAndFlipSetting);
            this.setStoreValue('motionDetectConfig', response.motionDetectConfig);
            this.setStoreValue('productAllInfo', response.productAllInfo);
            this.setStoreValue('PTZPresetPointList', this._formatPresetPointList(response.PTZPresetPointList));
            this.setStoreValue('scheduleRecordConfig', response.scheduleRecordConfig);

            // Image capabilities
            this.setCapabilityValue('brightness', Number(response.imageSetting.brightness));
            this.setCapabilityValue('contrast', Number(response.imageSetting.contrast));
            this.setCapabilityValue('hue', Number(response.imageSetting.hue));
            this.setCapabilityValue('saturation', Number(response.imageSetting.saturation));
            this.setCapabilityValue('sharpness', Number(response.imageSetting.sharpness));

            // Mirror and flip capabilities
            this.setCapabilityValue('flip', Boolean(Number(response.mirrorAndFlipSetting.isFlip)));
            this.setCapabilityValue('mirror', Boolean(Number(response.mirrorAndFlipSetting.isMirror)));

        } catch (error) {
            this.error(error.message);
            this.setUnavailable(error.message);
        }
    }

    /*
    |---------------------------------------------------------------------------
    | Get device status
    |---------------------------------------------------------------------------
    |
    | This method is fetching the status from the camera and updates
    | the motion capability.
    |
    */

   async _getDeviceState () {
    try {
        if (this.motionDetectEnabled !== '1' || !this.motionDetectInterval) return; // motion detection disabled by user setting
        const response = await this.api.getDeviceState(this.motionDetectInterval);
        if (!response) return;  // ignore request timeouts

        // motion capabilities
        const motionDetectAlarm = response.motionDetectAlarm === '2';
        const humanDetectAlarmState = response.humanDetectAlarmState === '2';

        this.setCapabilityValue('alarm_motion', motionDetectAlarm || humanDetectAlarmState);

    } catch (error) {
        this.error(error.message);
    }
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
            schedule_record_isenabled: data.scheduleRecordConfig.isEnable,

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
    | Set motion command
    |---------------------------------------------------------------------------
    |
    | This method is used to update the motion command.
    |
    */

    async _setMotionCommand () {
        if (this.getStoreValue('motionCommand') === null) {
            try {
                await this.api.checkMotionCommand();

                this.setStoreValue('motionCommand', '0');
                this.success(`set motion command to \`0\``);
                this.motionCommand = '0';

            } catch (error) {
                this.setStoreValue('motionCommand', '1');
                this.success(`set motion command to \`1\``);
                this.motionCommand = '1';
            }
        } else {
            this.motionCommand = this.getStoreValue('motionCommand');
            this.success(`motion command is \`${this.motionCommand}\``);
        }
    }

    /*
    |---------------------------------------------------------------------------
    | Update motion detect configuration
    |---------------------------------------------------------------------------
    |
    | This method is used to update the motion detect configuration of the device.
    |
    */

    async setMotionDetectConfig (data) {
        let store = this.getStoreValue('motionDetectConfig');
        let command = 'setMotionDetectConfig';

        if (this.motionCommand === '1') {
            command = 'setMotionDetectConfig1';
        }

        if (data.motion_detect_isenable) {
            store.isEnable = data.motion_detect_isenable;
        }

        if (data.motion_detect_sensitivity) {
            if (store.sensitivity) {
                store.sensitivity = data.motion_detect_sensitivity;
            }
            if (store.sensitivity1) {
                store.sensitivity1 = data.motion_detect_sensitivity;
            }
            if (store.sensitivity2) {
                store.sensitivity2 = data.motion_detect_sensitivity;
            }
            if (store.sensitivity3) {
                store.sensitivity3 = data.motion_detect_sensitivity;
            }
        }

        return this.api.set(command, store)
            .then( () => {
                this.setStoreValue('motionDetectConfig', store);
                this.success(`motion config updated on device`);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Update schedule record configuration
    |---------------------------------------------------------------------------
    |
    | This method is used to update the schedule record configuration of the device.
    |
    */

    async setScheduleRecordConfig (data) {
        let store = this.getStoreValue('scheduleRecordConfig');

        if (data.schedule_record_isenabled) {
            store.isEnable = data.schedule_record_isenabled;
        }

        return this.api.set('setScheduleRecordConfig', store)
            .then( () => {
                this.setStoreValue('scheduleRecordConfig', store);
                this.success(`schedule record config updated on device`);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | API functions
    |---------------------------------------------------------------------------
    |
    | These functions are supported by the device.
    |
    */

    // Goto preset point
    async ptzGotoPresetPoint (args) {
        let presetName = args.ptz_preset_point.name;

        if (!this.pt_support) {
            this.error(`does not support Pan/Tilt commands`);
            throw Error(`Camera does not support Pan/Tilt`);

        }

        return this.api.set('ptzGotoPresetPoint', { name: presetName })
            .then( () => {
                this.success(`goto PTZ point: \`${presetName}\``);
            });
    }

    // Reboot camera
    async rebootSystem () {
        return this.api.get('rebootSystem')
            .then( () => {
                this.success(`is rebooting`);
            });
    }

    // Set brightness
    async setBrightness (value) {
        return this.api.set('setBrightness', { brightness: Number(value) })
            .then( () => {
                this.setCapabilityValue('brightness', Number(value));
                this.success(`brightness set to \`${value}\``);
            });
    }

    // Set contrast
    async setContrast (value) {
        return this.api.set('setContrast', { constrast: Number(value) }) // <-- Typo in API
            .then( () => {
                this.setCapabilityValue('contrast', Number(value));
                this.success(`contrast set to \`${value}\``);
            });
    }

    // Flip the video
    async setFlipView (value) {
        let bool = Boolean(Number(value));

        return this.api.set('flipVideo', { isFlip: bool ? 1 : 0 })
            .then( () => {
                this.setCapabilityValue('flip', bool);
                this.success(`flip view set to \`${value}\``);
            });
    }

    // Set hue
    async setHue (value) {
        return this.api.set('setHue', { hue: Number(value) })
            .then( () => {
                this.setCapabilityValue('hue', Number(value));
                this.success(`hue set to \`${value}\``);
            });
    }

    // Mirror the video
    async setMirrorView (value) {
        let bool = Boolean(Number(value));

        return this.api.set('mirrorVideo', { isMirror: bool ? 1 : 0 })
            .then( () => {
                this.setCapabilityValue('mirror', bool);
                this.success(`mirror view set to \`${value}\``);
            });
    }

    // Set saturation
    async setSaturation (value) {
        return this.api.set('setSaturation', { saturation: Number(value) })
            .then( () => {
                this.setCapabilityValue('saturation', Number(value));
                this.success(`saturation set to \`${value}\``);
            });
    }

    // Set sharpness
    async setSharpness (value) {
        return this.api.set('setSharpness', { sharpness: Number(value) })
            .then( () => {
                this.setCapabilityValue('sharpness', Number(value));
                this.success(`sharpness set to \`${value}\``);
            });
    }

    // Take snapshot
    async takeSnapshot () {
        this.success('taking snapshot');

        this.image.update().catch(this.error);

        this.driver = this.getDriver();
        this.driver.snapshotTrigger.trigger(this);

        let sendEmail = false;

        // Send email if setting 'mail_after_snapshot' is true
        if (Homey.ManagerSettings.get('after_snapshot')) {
            sendEmail = Boolean(Number(Homey.ManagerSettings.get('after_snapshot')));
        }

        if (sendEmail) {
            if (this.image.getStream) {
                return this.image.getStream()
                    .then( image => {
                        return Homey.app.mail.send(this.getName(), image);
                    });
            } else {
                return this.image.getBuffer(async (err, data) => {
                    return Homey.app.mail.send(this.getName(), Buffer.from(data));
                });
            }
        }
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

    /*
    |---------------------------------------------------------------------------
    | Set the refresh interval timer
    |---------------------------------------------------------------------------
    |
    | This method sets the refresh interval in seconds.
    |
    */

    _setRefreshTimer (seconds) {
        if (this._deviceRefreshTimer) {
            clearInterval(this._deviceRefreshTimer);
        }

        let refreshInterval = seconds * 1000;

        this._deviceRefreshTimer = setInterval( () => {
            this._getDeviceData();
        }, refreshInterval);

        this.success(`refresh interval set to ${seconds} seconds`);
    }

    _setMotionDetectTimer () {
        if (this._motionDetectTimer) {
            clearInterval(this._motionDetectTimer);
        }
 
        if (this.motionDetectEnabled !== '1') {
            this.success(`motion detect polling is disabled`);
            return;
        }

        const refreshInterval = this.motionDetectInterval * 1000;

        this._motionDetectTimer = setInterval( () => {
            this._getDeviceState(this.motionDetectInterval);
        }, refreshInterval);

        this.success(`motion detect polling set to ${this.motionDetectInterval} seconds`);
    }

};

module.exports = Device;