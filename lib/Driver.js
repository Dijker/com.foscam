'use strict';

const Homey = require('homey');

const Api = require('./../lib/Api.js');

class Driver extends Homey.Driver {

    onInit ()
    {
        // Flow card: Triggers
        this._addFlowCardTriggers();

        // Flow card: Actions
        this._addFlowCardActions();
    }

    onPair (socket)
    {
        this.log('Start pairing device');

        socket.on('addDevice', async (data, callback) => {

            let api = new Api(data);

            try {
                await this.checkDuplicate(data.host);
                let result = await api.get('getDevInfo');

                callback(null, result);

            } catch (err) {
                callback(err);
            }

        });
    }

    async checkDuplicate (host)
    {
        let addHost = String(host);

        this.getDevices().forEach( (device) => {

            if (String(device.getSetting('host')) === addHost) {
                this.error('Trying to add a duplicate device with host ' + addHost);
                throw new Error(Homey.__('error.duplicate_device'));
            }
        });
    }

    async _addFlowCardTriggers ()
    {
        this.snapshotTrigger = new Homey.FlowCardTriggerDevice('snapshot')
            .register();
    }

    async _addFlowCardActions ()
    {
        new Homey.FlowCardAction('brightness').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setBrightness(args.value);

            });

        new Homey.FlowCardAction('contrast').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setContrast(args.value);

            });

        new Homey.FlowCardAction('flip').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setFlipView(args.value);

            });

        new Homey.FlowCardAction('hue').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setHue(args.value);

            });

        new Homey.FlowCardAction('mirror').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setMirrorView(args.value);

            });

        new Homey.FlowCardAction('motion_detection_isenabled').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setMotionDetectConfig({
                    motion_detect_isenable: args.value
                });

            });

        new Homey.FlowCardAction('reboot').register()
            .registerRunListener( async (args, state) => {

                return await args.device.rebootDevice();

            });

        new Homey.FlowCardAction('saturation').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setSaturation(args.value);

            });

        new Homey.FlowCardAction('sharpness').register()
            .registerRunListener( async (args, state) => {

                return await args.device.setSharpness(args.value);

            });

        new Homey.FlowCardAction('snapshot').register()
            .registerRunListener( async (args, state) => {

                return await args.device.takeSnapshot();

            });

        new Homey.FlowCardAction('ptz_goto_preset_point').register()
            .registerRunListener( async (args, state) => {

                return await args.device.ptzGotoPresetPoint(args);

            })
            .getArgument('ptz_preset_point')
            .registerAutocompleteListener( async (query, args) => {

                let results = args.device.getStoreValue('PTZPresetPointList');

                results = results.filter((result) => {
                    const nameFound = result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
                    return nameFound;
                });

                return await results;
            });

        new Homey.FlowCardAction('send_image').register()
            .registerRunListener( (args, state) => {

                let image = args.droptoken;
                let deviceName = args.device.getName();

                image.getBuffer( async (err, data) => {

                    return await args.device._mail.send(deviceName, data);

                });
            });
    }

};

module.exports = Driver;