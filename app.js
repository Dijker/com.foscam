'use strict';

const Homey = require('homey');

const Mail = require('/lib/Mail');
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

        this.mail = new Mail();

        console.log('✓ Foscam App running');
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