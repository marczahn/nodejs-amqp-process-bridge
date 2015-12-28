var amqp = require('amqplib'),
    Promise = require('promise'),
    workerService = require('./services/worker-service.js'),
    ManifestService = require('./services/manifest-service');

if (process.argv.length < 3) {
    console.log('No manifest specified');
    process.exit(1);
}
for (var i = 2; i < process.argv.length; ++i) {
    var manifestFile = process.argv[2];
    try {
        var manifest = new ManifestService(require(manifestFile));
        runInstance(manifest);
    } catch (e) {
        console.error('Instance for "' + manifestFile + '" could not be started: "' + e + '"');
    }
}

function catchConnectionError(manifest, error) {
    console.log(error);
}

function afterConnectionOpened(manifest, connection) {
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
        manifest.getExchangeConfigs().forEach(function(exchangeConfig) {
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
            manifest.getQueueConfigs().forEach(function(queueConfig) {
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
                manifest.getQueueConfigs().forEach(function(queueConfig) {
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
}

function runInstance(manifest) {
    var connectionOpened = amqp.connect(manifest.getConnectionConfig().getConnectionString());
    connectionOpened.catch(function(error) {
        catchConnectionError(manifest, error);
    });
    // Open connection
    connectionOpened.then(function(connection) {
        afterConnectionOpened(manifest, connection);

        process.once('SIGINT', function() {
            console.log('Closing connection...');
            var connectionClosed = connection.close();
            connectionClosed.then(function() {
                console.log('Connection closed');
            })
        });

    });
}
