'use strict';

const Homey = require('homey');

const StdOutFixture = require('fixture-stdout');
const fs = require('fs');

class Logger {

    constructor (logName, logLength)
    {
        this.logName   = logName || 'log';
        this.logLength = logLength || 100;
        this.logFile   = `/userdata/${this.logName}.json`;
        this.logArray  = [];

        this.getLogs();
        this.captureStdOut();
        this.captureStdErr();
    }

    getLogs ()
    {
        if (!fs.existsSync(this.logFile)) {

            return [];

        } else {

            fs.readFile(this.logFile, 'utf8', (err, data) => {
                if (err) {
                    Homey.app.error('Error reading logfile: ', err.message);
                    return [];
                } else if (data.length === 0) {
                    return [];
                }

                try {
                    this.logArray = JSON.parse(data);
                    return this.logArray;

                } catch (err) {
                    Homey.app.error('Error parsing logfile: ', err.message);
                    return [];
                }
            });
        }
    }

    saveLogs ()
    {
        fs.writeFile(this.logFile, JSON.stringify(this.logArray), (err) => {
            if (err) {
                Homey.app.error('Error writing logfile: ', err.message);
            } else {
                Homey.app.log('Logfile saved successfully!');
            }
        });
    }

    deleteLogs ()
    {
        if (fs.existsSync(this.logFile)) {
            fs.unlink(this.logFile, (err) => {
                if (err) {
                    Homey.app.error('Error deleting logfile: ', err.message);
                } else {
                    Homey.app.log('Logfile deleted successfully!');
                }
            });
        }

        this.logArray = [];
    }

    captureStdOut ()
    {
        this.captureStdout = new StdOutFixture({ stream: process.stdout });

        Homey.app.log('Capturing stdout...');

        this.captureStdout.capture((string) => {

            if (this.logArray.length >= this.logLength) {
                this.logArray.shift();
            }

            this.logArray.push(string);
        });
    }

    captureStdErr ()
    {
        this.captureStderr = new StdOutFixture({ stream: process.stderr });

        Homey.app.log('Capturing stderr...');

        this.captureStderr.capture((string) => {

            if (this.logArray.length >= this.logLength) {
                this.logArray.shift();
            }

            this.logArray.push(string);
        });
    }

    releaseStdOut ()
    {
        this.captureStdout.release();
    }

    releaseStdErr ()
    {
        this.captureStderr.release();
    }

}

module.exports = Logger;