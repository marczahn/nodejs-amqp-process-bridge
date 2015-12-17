var
    async = require('async'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    InstanceService = require('./services/instance-service'),
    exchangeService = require('./services/exchange-service');

if (process.argv.length < 3) {
    console.log('No config specified');
    process.exit(1);
}
var config = require(process.argv[2]);
    
async.forEach(instances, function(configFile, instanceName) {
    instance = new InstanceService(configFile);
    instance.run();
});




connectionOpened.then(function(connection) {
    process.once('SIGINT', function() {
        console.log('Closing connection...');
        connection.close().then(function() {
            console.log('Connection closed');
        });
    });
});

connectionOpened.then(function(connection) {
    var channelCreated = connection.createChannel();

    channelCreated.then(function(channel) {
        var queuesAsserted = {};
        exchangeService.init(channel);
        config.amqp.queues.forEach(function(queueConfig) {
            queueAsserted =
                channel.assertQueue(
                    queueConfig.name,
                    {
                        durable: queueConfig.durable != undefined ? queueConfig.durable : true
                    }
                );

            queueAsserted.then(function() {
                channel.prefetch(1);
            }).then(function() {
                queueConfig.routingKeys.forEach(function (routingKey) {
                    channel.bindQueue(
                        queueConfig.name, config.amqp.exchanges[queueConfig.exchange].name, routingKey
                    );
                });
            }).then(function() {
                channel.consume(queueConfig.name, function(message) {
                    worker(message, channel)
                })
                console.log('Start consuming on queue ' + queueConfig.name)
            });
            queuesAsserted[queueConfig.name] = queuesAsserted;
        });
    });
});

var worker = function(message, channel) {
    var content = message.content.toString();
    console.log(content);
    channel.ack(message);
};
