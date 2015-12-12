var config = require('config'),
    amqp = require('amqplib'),
    exchangeService = require('./services/exchange-service');
    connectionString = 'amqp://' + config.amqp.connection.host + ':' + config.amqp.connection.port,
    connectionOpened = amqp.connect(connectionString);

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
