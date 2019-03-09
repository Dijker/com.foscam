'use strict';

const Homey = require('homey');

const rp = require('request-promise-native');
const convert = require('xml-js');

function FatalError(message, error)
{
    return {
        name: 'FatalError',
        message: message,
        error: error
    };
}

function ApiError(message, error)
{
    return {
        name: 'ApiError',
        message: message,
        error: error
    };
}

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

        var qstr = {
            usr: this.username,
            pwd: this.password,
            cmd: cmd
        };

        let qs = {...qstr, ...data};

        var rpOptions = {
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

                rpOptions.qs.pwd = '****';

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
                    switch (resultId) {
                        case -2:
                            throw new FatalError(Homey.__('error.username_password_invalid'), response);
                        case -3:
                            throw new ApiError(Homey.__('error.invalid_response'), response);
                        default:
                            throw new ApiError(Homey.__('error.unknown_error'), response);
                    }
                }

                return returnObj;
            })
            .catch( err => {
                rpOptions.qs.pwd = '****';

                if (err.name === 'RequestError') {
                    throw new FatalError(Homey.__('error.connection_refused'), err.error);
                } else if (err.name === 'StatusCodeError') {
                    throw new FatalError(Homey.__('error.invalid_response'), err.error);
                } else {
                    throw err;
                }
            });
    }

    async get (cmd, data)
    {
        return await this._http('get', cmd, data);
    }

};

module.exports = Api;