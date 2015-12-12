var config = require('config'),
    amqp = require('amqplib'),
    async = require('async'),
    connectionString = 'amqp://' + config.rabbitmq.connection.host + ':' + config.rabbitmq.connection.port,
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
        async.forEach(config.rabbitmq.exchanges, function(exchangeConfig) {
            channel.assertExchange(

                exchangeConfig.name,
                exchangeConfig.type,
                {durable: exchangeConfig.durable != undefined ? exchangeConfig.durable : true}
            );
        });
        config.rabbitmq.queues.forEach(function(queueConfig) {
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
                        queueConfig.name, config.rabbitmq.exchanges[queueConfig.exchange].name, routingKey
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
