'use strict';

const Homey = require('homey');

const axios = require('axios');
const parser = require('xml2json-light');

const requestTimeout = 1000 * 5; //  5 seconds

class Api {

    /*
    |---------------------------------------------------------------------------
    | Constructor
    |---------------------------------------------------------------------------
    */

    constructor (data) {
        this.url = `http://${data.ip}:${data.port}/cgi-bin/CGIProxy.fcgi`;
        this.timeout = requestTimeout;
        this.username = data.username;
        this.password = data.password;
    }

    /*
    |---------------------------------------------------------------------------
    | Get result of command from camera
    |---------------------------------------------------------------------------
    |
    | This method sends a command to the camera.
    |
    */

    async get (command) {
        let config = this._getDefaultConfig();

        config.params.cmd = command;

        return axios(config)
            .then( response => {
                return this._validate(response);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Update values on camera
    |---------------------------------------------------------------------------
    |
    | This method sends a command and its data to the camera.
    |
    */

    async set (command, data) {
        let config = this._getDefaultConfig();

        config.params.cmd = command;

        Object.keys(data).forEach(key => {
            config.params[key] = data[key];
        });

        return axios(config)
            .then( response => {
                return this._validate(response);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Check motion command
    |---------------------------------------------------------------------------
    |
    | This method is only called when a new device is added. Some cameras are
    | using the `getMotionDetectConfig` command, others `getMotionDetectConfig1`.
    |
    | This is only a method to check if the response is valid, nothing else.
    |
    */

    async checkMotionCommand () {
        let config = this._getDefaultConfig();

        config.params.cmd = 'getMotionDetectConfig';

        return axios(config)
            .then( response => {
                return this._validate(response);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Get stream snapshot
    |---------------------------------------------------------------------------
    |
    | This method returns a snapshot in a stream.
    |
    */

    async getStreamSnapshot () {
        let config = this._getDefaultConfig();

        delete config.transformResponse;

        config.responseType = 'stream';
        config.params.cmd = 'snapPicture2';

        return axios(config)
            .then( response => {
                return response.data;
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Get buffer snapshot
    |---------------------------------------------------------------------------
    |
    | This method returns a snapshot string.
    |
    */

    async getBufferSnapshot () {
        let config = this._getDefaultConfig();

        delete config.transformResponse;

        config.responseType = 'arraybuffer';
        config.params.cmd = 'snapPicture2';

        return axios(config)
            .then( response => {
                return Buffer.from(response.data);
            });
    }

    /*
    |---------------------------------------------------------------------------
    | Get all data from camera and return data
    |---------------------------------------------------------------------------
    |
    | This method is used for fetching all the data Homey needs from the camera.
    |
    */

    async getDeviceData (motionCommandID) {
        let motionCommand = 'getMotionDetectConfig';

        if (motionCommandID === '1') {
            motionCommand = 'getMotionDetectConfig1';
        }

        try {
            let device  = await this.get('getDevInfo');
            let image   = await this.get('getImageSetting');
            let mirror  = await this.get('getMirrorAndFlipSetting');
            let motion  = await this.get(motionCommand);
            let product = await this.get('getProductAllInfo');
            let presets = await this.get('getPTZPresetPointList');
            let record  = await this.get('getScheduleRecordConfig');

            return {
                devInfo: device,
                imageSetting: image,
                mirrorAndFlipSetting: mirror,
                motionDetectConfig: motion,
                productAllInfo: product,
                PTZPresetPointList: presets,
                scheduleRecordConfig: record
            };

        } catch (error) {
            throw Error(this._error(error));
        }
    }

    /*
    |---------------------------------------------------------------------------
    | Get default axios configuration
    |---------------------------------------------------------------------------
    */

    _getDefaultConfig () {
        const config = {
            url: this.url,
            timeout: this.timeout,
            params: {
                usr: this.username,
                pwd: this.password
            },
            transformResponse: function (data) {
                let json = parser.xml2json(data);

                if (json && json.CGI_Result) {
                    return json.CGI_Result;
                }
            }
        };

        return config;
    }

    /*
    |---------------------------------------------------------------------------
    | Validate API response
    |---------------------------------------------------------------------------
    */

    async _validate (response) {
        let data = response.data;

        if (data.result === '0') {
            delete data.result;
            return data;
        }
        else if (data.result === '-2') {
            throw Error(Homey.__('error.login'));
        }
        else if (data.result === '-3') {
            throw Error(Homey.__('error.response'));
        }
        else {
            console.log(`--- API error ---`);
            console.log(data);
            throw Error(Homey.__('error.unknown'));
        }
    }

    /*
    |---------------------------------------------------------------------------
    | Return readable error
    |---------------------------------------------------------------------------
    */

    _error (error) {
        if (error.response) {
            return Homey.__('error.response');
        }
        else if (error.request) {
            return Homey.__('error.request');
        }
        else {
            return error.message;
        }
    }

};

module.exports = Api;