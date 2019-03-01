'use strict';

const Homey = require('homey');

const Logger = require('./lib/Logger.js');

class App extends Homey.App {

    onInit ()
    {
        this.logger = new Logger('foscam', 200);
        this.log(`${Homey.manifest.id} running...`);

        process.on('unhandledRejection', (err) => {
            this.error('unhandledRejection! ', err);
        });

        process.on('uncaughtException', (err) => {
            this.error('uncaughtException! ', err);
        });

        Homey.on('cpuwarn', () => {
            this.log('-- CPU warning! --');
        }).on('memwarn', () => {
            this.log('-- Memory warning! --');
        }).on('unload', () => {
            this.log('Unloading app...');
            this.logger.saveLogs();
        });
    }

    deleteLogs ()
    {
        this.logger.deleteLogs();
    }

    getLogs ()
    {
        return this.logger.logArray;
    }

};

module.exports = App;