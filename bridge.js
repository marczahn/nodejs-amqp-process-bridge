var amqp = require('amqplib'),
    Promise = require('promise'),
    workerService = require('./services/worker-service.js'),
    manifestService = require('./services/manifest-service'),
    appContext = this,
    afterConnectionOpened = function(connection) {
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
            manifestService.getExchangeConfigs().forEach(function(exchangeConfig) {
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
                manifestService.getQueueConfigs().forEach(function(queueConfig) {
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

                // Start consuming
                Promise.all(queuesAsserted).then(function() {
                    manifestService.getQueueConfigs().forEach(function(queueConfig) {
                        for (var i = 0; i < queueConfig.consumers; ++i) {
                            channel.consume(queueConfig.name, function (message) {
                                workerService.work(message, queueConfig, channel)
                            });
                        }
                        console.log('Start consuming on queue ' + queueConfig.name)
                    });
                });
            });
        });
    },
    run = function() {
        var connectionOpened = amqp.connect(manifestService.getConnectionConfig().getConnectionString());
        connectionOpened.then(function(connection) {
            connection.on('close', function(error) {
                if (error != 'Closed by client') {
                    run.call(appContext);
                }
            });
            afterConnectionOpened(connection);

            process.once('SIGINT', function() {
                console.log('Closing connection...');
                var connectionClosed = connection.close();
                connectionClosed.then(function() {
                    console.log('Connection closed');
                })
            });

        });
    };

run();
