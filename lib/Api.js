'use strict';

const Homey = require('homey');

const parser = require('xml2json-light');
const http = require('httpreq');
const util = require('util');

const refreshTimeout = 1000 * 5;

class Api {

    async checkMotionCommand (device_data) {
        return this._httpRequest(device_data, 'getMotionDetectConfig', false);
    }

    async getDeviceInfo (device_data) {
        return this._httpRequest(device_data, 'getDevInfo', false);
    }

    async getDeviceData (device_data) {
        let motionCommand = 'getMotionDetectConfig';

        if (device_data.motionCommand === '1') {
            motionCommand = 'getMotionDetectConfig1';
        }

        let device  = await this._httpRequest(device_data, 'getDevInfo', false);
        let image   = await this._httpRequest(device_data, 'getImageSetting', false);
        let mirror  = await this._httpRequest(device_data, 'getMirrorAndFlipSetting', false);
        let motion  = await this._httpRequest(device_data, motionCommand, false);
        let product = await this._httpRequest(device_data, 'getProductAllInfo', false);
        let presets = await this._httpRequest(device_data, 'getPTZPresetPointList', false);

        var data = {
            devInfo: device,
            imageSetting: image,
            mirrorAndFlipSetting: mirror,
            motionDetectConfig: motion,
            productAllInfo: product,
            PTZPresetPointList: presets
        };

        return data;
    }

    async sendCommand (device_data, command, params) {
        return this._httpRequest(device_data, command, false, params);
    }

    async getDeviceInfo (device_data) {
        return this._httpRequest(device_data, 'getDevInfo', false);
    }

    async getSnapshot (device_data) {
        return this._httpRequest(device_data, 'snapPicture2', true);
    }

    async setMotionDetectConfig (device_data, params) {
        let command = 'setMotionDetectConfig';

        if (device_data.motionCommand === '1') {
            command = 'setMotionDetectConfig1';
        }

        return this._httpRequest(device_data, command, false, params);
    }

    // =========================================================================

    /**
     * HTTP request functions
     */

    async _httpRequest (device_data, command, raw, params) {
        var fullUrl = `http://${device_data.ip}:${device_data.port}/cgi-bin/CGIProxy.fcgi`;

        var options = {
            url: fullUrl,
            binary: raw,
            method: 'GET',
            timeout: refreshTimeout
        };

        // Params is optional
        if (typeof params === 'undefined') {
            params = {};
        }

        params.cmd = command;
        params.usr = device_data.username;
        params.pwd = device_data.password;

        options.parameters = params;

        const httpPromise = util.promisify(http.doRequest);

        return httpPromise(options)
            .then( result => {
                if (raw) {
                    return result.body;
                }

                return this._httpResponse(result);
            }).catch( err => {
                params.pwd = '****';
                console.log(`───────────── ERROR ─────────────`);
                console.log(`URL     : ${fullUrl}`);
                console.log(`Command : ${command}`);
                console.log(`Model   : ${device_data.model}`);
                console.log(`Message : ${err.message}`);
                console.log(`Params  : ${JSON.stringify(params)}`);
                console.log(err);
                console.log(`─────────────────────────────────`);

                if (err.syscall && err.syscall === 'connect') {
                   throw Error(Homey.__('error.connection'));
                }

                throw err;
            });
    }

    async _httpResponse (result) {
        var data = result && result.body || '';
        var json = parser.xml2json(data);

        if (json && json.CGI_Result) {
            return this._processData(json.CGI_Result);
        } else {
            console.log('_httpResponse:', data);
            throw Error(Homey.__('error.response'));
        }
    }

    async _processData (data) {
        if (data.result === '0') {
            delete data.result;
            return data;
        } else if (data.result === '-2') {
            throw Error(Homey.__('error.login'));
        } else if (data.result === '-3') {
            throw Error(Homey.__('error.response'));
        } else {
            console.log('processData:', data);
            throw Error(Homey.__('error.unknown'));
        }
    }

};

module.exports = Api;