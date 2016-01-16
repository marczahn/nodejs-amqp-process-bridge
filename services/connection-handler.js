(function() {
    var workerService = require('./worker-service'),
        afterConnectionOpened = function(connection, config) {
        // Create channel
        var channelCreated = connection.createChannel();
        channelCreated.catch(function(error) {
            console.log(error);
        });
        channelCreated.then(function(channel) {
            var
                exchangesAsserted = [],
                queuesAsserted = [];

            // Configure exchanges
            config.getExchangeConfigs().forEach(function(exchangeConfig) {
                var exchangeAsserted = channel.assertExchange(
                    exchangeConfig.name,
                    exchangeConfig.type,
                    {
                        durable: exchangeConfig.durable,
                        autoDelete: exchangeConfig.autoDelete,
                        internal: exchangeConfig.internal,
                        arguments: exchangeConfig.arguments
                    }
                );
                exchangesAsserted.push(exchangeAsserted);
            });

            //Configure queues
            Promise.all(exchangesAsserted).then(function() {
                config.getQueueConfigs().forEach(function(queueConfig) {
                    var queueAsserted =
                        channel.assertQueue(
                            queueConfig.name,
                            {
                                durable: queueConfig.durable != undefined ? queueConfig.durable : true,
                                arguments: queueConfig.arguments != undefined ? queueConfig.arguments : {}
                            }
                        );
                    queueAsserted.then(function() {
                        channel.prefetch(queueConfig.prefetch != undefined ? queueConfig.prefetch : 1);
                        queueConfig.routingKeys.forEach(function (routingKey) {
                            channel.bindQueue(
                                queueConfig.name, queueConfig.exchange, routingKey
                            );
                        });
                    });
                    queuesAsserted.push(queueAsserted);
                });

                Promise.all(queuesAsserted).then(function() {
                    config.getQueueConfigs().forEach(function(queueConfig) {
                        for (var i = 0; i < queueConfig.consumers; ++i) {
                            channel.consume(queueConfig.name, function (message) {
                                workerService.work(message, queueConfig, channel)
                            });
                        }
                        console.log(
                            'Start consuming on queue '
                            + queueConfig.name 
                            + ' with ' 
                            + queueConfig.consumers 
                            + ' consumer' + (queueConfig.consumers != 1 ? 's' : '')
                        );
                    });
                });
            });
        });
    };

    module.exports = {
        handle: function(connection, config) {
            connection.on('close', function(error) {
                if (error != 'Closed by client') {
                    run.call(appContext);
                }
            });
                
            afterConnectionOpened(connection, config);    
        }
    };
})();