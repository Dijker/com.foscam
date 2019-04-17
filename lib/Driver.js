'use strict';

const Homey = require('homey');

let foundDevices = [];

class Driver extends Homey.Driver {

    /**
     * Events
     */

    onInit () {
        this._addFlowCardTriggers();
        this._addFlowCardActions();
    }

    onPair (socket) {
        console.log(`✓ Pairing started`);

        socket.on('search_devices', async (pairData, callback) => {
            console.log(`✓ Searching device`);

            foundDevices = [];

            Homey.app.getDeviceInfo(pairData)
                .then( result => {
                    foundDevices.push({
                        name: result.devName,
                        data: {
                            id: result.mac,
                            ip: pairData.ip,
                            port: pairData.port,
                            username: pairData.username,
                            password: pairData.password,
                            model: result.productName
                        }
                    });

                    callback(null, true);
                }). catch( err => {
                    callback(err);
                });
        });

        socket.on('list_devices', async (data, callback) => {
            console.log(`✓ Found device: ${foundDevices[0].name} (${foundDevices[0].data.model})`);
            callback(null, foundDevices);
        });
    }

    // =========================================================================

    /**
     * Flowcard triggers
     */

    async _addFlowCardTriggers () {
        this.snapshotTrigger = new Homey.FlowCardTriggerDevice('snapshot').register();
    }

    // =========================================================================

    /**
     * Flowcard actions
     */

    async _addFlowCardActions () {
        new Homey.FlowCardAction('brightness').register()
            .registerRunListener( async (args, state) => {
                return args.device.setBrightness(args.value);
            });

        new Homey.FlowCardAction('contrast').register()
            .registerRunListener( async (args, state) => {
                return args.device.setContrast(args.value);
            });

        new Homey.FlowCardAction('flip').register()
            .registerRunListener( async (args, state) => {
                return args.device.setFlipView(args.value);
            });

        new Homey.FlowCardAction('hue').register()
            .registerRunListener( async (args, state) => {
                return args.device.setHue(args.value);
            });

        new Homey.FlowCardAction('mirror').register()
            .registerRunListener( async (args, state) => {
                return args.device.setMirrorView(args.value);
            });

        new Homey.FlowCardAction('motion_detection_isenabled').register()
            .registerRunListener( async (args, state) => {
                return args.device.setMotionDetectConfig({
                    motion_detect_isenable: args.value
                });
            });

        new Homey.FlowCardAction('motion_detection_sensitivity').register()
            .registerRunListener( async (args) => {
                return args.device.setMotionDetectConfig({
                    motion_detect_sensitivity: args.value
                });
            });

        new Homey.FlowCardAction('reboot').register()
            .registerRunListener( async (args, state) => {
                return args.device.rebootSystem();
            });

        new Homey.FlowCardAction('saturation').register()
            .registerRunListener( async (args, state) => {
                return args.device.setSaturation(args.value);
            });

        new Homey.FlowCardAction('sharpness').register()
            .registerRunListener( async (args, state) => {
                return args.device.setSharpness(args.value);
            });

        new Homey.FlowCardAction('snapshot').register()
            .registerRunListener( async (args, state) => {
                return args.device.takeSnapshot();
            });

        new Homey.FlowCardAction('ptz_goto_preset_point').register()
            .registerRunListener( async (args, state) => {
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
            .registerRunListener( async (args, state) => {

                let image = args.droptoken;
                let deviceName = args.device.getName();

                image.getBuffer( async (err, data) => {
                    return args.device._mail.send(deviceName, data);
                });
            });
    }

};

module.exports = Driver;