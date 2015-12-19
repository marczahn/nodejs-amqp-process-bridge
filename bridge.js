var fs = require('fs'),
    amqp = require('ampq'),
    InstanceService = require('./services/instance-service'),
    ManifestService = require('./services/manifest-service');

if (process.argv.length < 3) {
    console.log('No manifest specified');
    process.exit(1);
}
var instances = {};
for (var i = 2; i < process.argv.length; ++i) {
    var manifestFile = process.argv[2];
    try {
        var manifest = new ManifestService(require(manifestFile));
        runInstance(manifest);
        
        instances[manifestFile] = new InstanceService(manifest);
        console.log('Starting instance for "' + manifestFile + '"...');
        instances[manifestFile].run();
    } catch (e) {
        console.error('Instance for "' + manifestFile + '" could not be started: "' + e + '"');
    }
}

function runInstance(manifest) {
    var connectionOpened = amqp.connect(manifest.getConnectionConfig().getConnectionString());
    connectionOpened.then(function(connection) {
        var channelCreated = connection.createChannel();
        channelCreated.then(function(channel) {
            var exchangeAsserted = channel.assertExchange(
                exchangeConfig.name,
                exchangeConfig.type,
                {
                    durable: exchangeConfig.durable != undefined ? exchangeConfig.durable : true
                }
            );
            exchangeAsserted.then(function() {
                
            });
        });
    });
}