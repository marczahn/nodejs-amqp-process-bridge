var bridge = require('./bridge');

if (process.argv.length != 3) {
    throw new Error('No config defined', 1);
}

bridge.run(process.argv[2]);