'use strict';

const Homey = require('homey');

const Api = require('/lib/Api');
const Logger = require('/lib/Logger');

class App extends Homey.App {

    /*
    |---------------------------------------------------------------------------
    | Initiate
    |---------------------------------------------------------------------------
    |
    | This method is called upon initialization of this application.
    |
    */

    onInit () {
        this.logger = new Logger('foscam', 200);

        console.log('✓ Foscam App running');

        this._api = new Api();
    }

    async checkMotionCommand (data) {
        return this._api.checkMotionCommand(data);
    }

    async getDeviceData (data) {
        return this._api.getDeviceData(data);
    }

    async getDeviceInfo (data) {
        return this._api.getDeviceInfo(data);
    }

    async getSnapshot (data) {
        return this._api.getSnapshot(data);
    }

    async sendCommand (command, data, params) {
        return this._api.sendCommand(data, command, params);
    }

    /*
    |---------------------------------------------------------------------------
    | Set motion detection configuration
    |---------------------------------------------------------------------------
    |
    | This method is used to update the motion detection config of the camera.
    |
    */

    async setMotionDetectConfig (data, store, settings) {
        if (settings.motion_detect_isenable) {
            store.isEnable = settings.motion_detect_isenable;
        }

        if (settings.motion_detect_sensitivity) {
            if (store.sensitivity) {
                store.sensitivity = settings.motion_detect_sensitivity;
            }
            if (store.sensitivity1) {
                store.sensitivity1 = settings.motion_detect_sensitivity;
            }
            if (store.sensitivity2) {
                store.sensitivity2 = settings.motion_detect_sensitivity;
            }
            if (store.sensitivity3) {
                store.sensitivity3 = settings.motion_detect_sensitivity;
            }
        }

        return this._api.setMotionDetectConfig(data, store)
            .then( () => {
                return store;
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Purge logfile
    |---------------------------------------------------------------------------
    |
    | This method is used to purge the logfile.
    |
    */

    deleteLogs () {
        return this.logger.deleteLogs();
    }

    /*
    |---------------------------------------------------------------------------
    | Get logfile content
    |---------------------------------------------------------------------------
    |
    | This method is used to fetch the content of the logfile in an array.
    |
    */

    getLogs () {
        return this.logger.logArray;
    }

};

module.exports = App;