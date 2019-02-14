'use strict';

const Homey = require('homey');

class App extends Homey.App {

    onInit ()
    {
        console.log(`${Homey.manifest.id} running...`);
    }

};

module.exports = App;