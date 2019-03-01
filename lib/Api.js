'use strict';

const Homey = require('homey');

const rp = require('request-promise-native');
const convert = require('xml-js');

class Api {

    constructor (options)
    {
        this.host = options.host || null;
        this.port = options.port || null;
        this.username = options.username || null;
        this.password = options.password || null;
    }

    async _http (method, cmd, data)
    {
        if (!this.host || !this.port || !this.username || !this.password) {
            throw new Error(Homey.__('error.missing_settings'));
        }

        let qstr = {
            usr: this.username,
            pwd: this.password,
            cmd: cmd
        };

        let qs = {...qstr, ...data};

        let rpOptions = {
            method,
            uri: 'http://' + this.host + ':' + this.port + '/cgi-bin/CGIProxy.fcgi',
            qs: qs,
            timeout: 5000,
            json: false
        };

        if (qs.cmd === 'snapPicture2') {
            rpOptions.encoding = null;
        }

        return rp(rpOptions)
            .then( response => {

                if (qs.cmd === 'snapPicture2') {
                    return response;
                }

                let jsonData  = JSON.parse(convert.xml2json(response, { compact: true }));
                let resData   = jsonData.CGI_Result;
                let returnObj = {};

                Object.keys(resData).forEach(key => {
                    returnObj[key] = resData[key]._text;
                });

                let resultId = parseInt(returnObj.result);

                if (resultId !== 0) {
                    Homey.app.log('HTTP response', response);

                    switch (resultId) {
                        case -2:
                            throw new Error(Homey.__('error.username_password_invalid'));
                        case -3:
                            throw new Error(Homey.__('error.access_denied'));
                        default:
                            throw new Error(Homey.__('error.unknown_error') + ' - Code: ' + resultId);
                    }
                }

                return returnObj;
            })
            .catch( err => {
                Homey.app.error(err);

                if (err.name === 'RequestError') {
                    throw new Error(Homey.__('error.connection_refused'));
                } else if (err.name === 'StatusCodeError') {
                    throw new Error(Homey.__('error.wrong_type_response'));
                }

                throw err;
            });
    }

    async get (cmd, data)
    {
        return await this._http('get', cmd, data);
    }

};

module.exports = Api;