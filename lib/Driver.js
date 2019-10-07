'use strict';

const Homey = require('homey');

const Api = require('/lib/Api');

let foundDevices = [];

class Driver extends Homey.Driver {

    /*
    |---------------------------------------------------------------------------
    | Initiate
    |---------------------------------------------------------------------------
    |
    | This method is called when the driver is initiated.
    |
    */

    onInit () {
        this.snapshotTrigger = new Homey.FlowCardTriggerDevice('snapshot').register();

        this._addFlowCardActions();
    }

    /*
    |---------------------------------------------------------------------------
    | Pairing
    |---------------------------------------------------------------------------
    |
    | This method is called when a pair session starts.
    |
    */

    onPair (socket) {
        console.log(`✓ Pairing started`);

        socket.on('search_devices', async (pairData, callback) => {
            console.log(`✓ Searching device`);

            foundDevices = [];

            let api = new Api(pairData);

            api.get('getDevInfo')
                .then( response => {
                    foundDevices.push({
                        name: response.devName,
                        data: {
                            id: response.mac,
                            ip: pairData.ip,
                            port: pairData.port,
                            username: pairData.username,
                            password: pairData.password,
                            model: response.productName
                        }
                    });

                    callback(null, true);
                }). catch( error => {
                    callback(error);
                });
        });

        socket.on('list_devices', async (data, callback) => {
            console.log(`✓ Found device: ${foundDevices[0].name} (${foundDevices[0].data.model})`);
            callback(null, foundDevices);
        });
    }

    /*
    |---------------------------------------------------------------------------
    | Add flowcard actions
    |---------------------------------------------------------------------------
    |
    | Register flowcard actions which can be used in Homey 'Then' section.
    |
    */

    async _addFlowCardActions () {
        new Homey.FlowCardAction('brightness').register()
            .registerRunListener( async (args) => {
                return args.device.setBrightness(args.value);
            });

        new Homey.FlowCardAction('contrast').register()
            .registerRunListener( async (args) => {
                return args.device.setContrast(args.value);
            });

        new Homey.FlowCardAction('flip').register()
            .registerRunListener( async (args) => {
                return args.device.setFlipView(args.value);
            });

        new Homey.FlowCardAction('hue').register()
            .registerRunListener( async (args) => {
                return args.device.setHue(args.value);
            });

        new Homey.FlowCardAction('mirror').register()
            .registerRunListener( async (args) => {
                return args.device.setMirrorView(args.value);
            });

        new Homey.FlowCardAction('motion_detection_isenabled').register()
            .registerRunListener( async (args) => {
                return args.device.setMotionDetectConfig({
                    motion_detect_isenable: args.value
                });
            });

        new Homey.FlowCardAction('schedule_record_isenabled').register()
            .registerRunListener( async (args) => {
                return args.device.setScheduleRecordConfig({
                    schedule_record_isenabled: args.value
                });
            });

        new Homey.FlowCardAction('motion_detection_sensitivity').register()
            .registerRunListener( async (args) => {
                return args.device.setMotionDetectConfig({
                    motion_detect_sensitivity: args.value
                });
            });

        new Homey.FlowCardAction('reboot').register()
            .registerRunListener( async (args) => {
                return args.device.rebootSystem();
            });

        new Homey.FlowCardAction('saturation').register()
            .registerRunListener( async (args) => {
                return args.device.setSaturation(args.value);
            });

        new Homey.FlowCardAction('sharpness').register()
            .registerRunListener( async (args) => {
                return args.device.setSharpness(args.value);
            });

        new Homey.FlowCardAction('snapshot').register()
            .registerRunListener( async (args) => {
                return args.device.takeSnapshot();
            });

        new Homey.FlowCardAction('ptz_goto_preset_point').register()
            .registerRunListener( async (args) => {
                return args.device.ptzGotoPresetPoint(args);
            })
            .getArgument('ptz_preset_point')
            .registerAutocompleteListener( async (query, args) => {

                let results = args.device.getStoreValue('PTZPresetPointList');

                results = results.filter( (result) => {
                    const nameFound = result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
                    return nameFound;
                });

                return results;
            });

        new Homey.FlowCardAction('send_image').register()
            .registerRunListener( async (args) => {

                let image = args.droptoken;
                let deviceName = args.device.getName();

                if (image.getStream) {
                    return image.getStream()
                        .then( image => {
                            return Homey.app.mail.send(deviceName, image);
                        });
                } else {
                    return image.getBuffer(async (err, data) => {
                        return Homey.app.mail.send(deviceName, Buffer.from(data));
                    });
                }
            });
    }

};

module.exports = Driver;