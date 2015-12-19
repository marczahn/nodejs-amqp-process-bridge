var amqp = require('amqplib'),
    child_process = require('child_process'),
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

function runInstance(manifest) {
    var connectionOpened = amqp.connect(manifest.getConnectionConfig().getConnectionString());
    connectionOpened.then(function(connection) {
        var channelCreated = connection.createChannel();

        channelCreated.then(function(channel) {
            var queuesAsserted = {};
            manifest.getExchangeConfig().forEach(function(exchangeConfig) {
                channel.assertExchange(

                    exchangeConfig.name,
                    exchangeConfig.type,
                    {
                        durable: exchangeConfig.durable != undefined ? exchangeConfig.durable : true
                    }
                );
            });
            manifest.getQueueConfig().forEach(function(queueConfig) {
                queueAsserted =
                    channel.assertQueue(
                        queueConfig.name,
                        {
                            durable: queueConfig.durable != undefined ? queueConfig.durable : true
                        }
                    );

                queueAsserted.then(function() {
                    channel.prefetch(3);
                }).then(function() {
                    queueConfig.routingKeys.forEach(function (routingKey) {
                        channel.bindQueue(
                            queueConfig.name, queueConfig.exchange, routingKey
                        );
                    });
                }).then(function() {
                    channel.consume(queueConfig.name, function(message) {
                        worker(message, queueConfig, channel)
                    })
                    console.log('Start consuming on queue ' + queueConfig.name)
                });
                queuesAsserted[queueConfig.name] = queuesAsserted;
            });
        });
    });
}

function worker(message, queueConfig, channel) {
    if (typeof queueConfig.processor == 'function') {
        setTimeout(function() {
            var result = queueConfig.processor.call(null, message.content.toString(), queueConfig, channel);
            if (queueConfig.ackByProcessor && result) {
                channel.ack(message);
            }
        }, 0);
        if (!queueConfig.ackByProcessor) {
            channel.ack(message);
        }

        return;
    }

    if (typeof queueConfig.processor == 'string') {
        var cmd = queueConfig.processor.replace('%message%', message.content.toString());

        child_process.exec(cmd, function (err, stdout, stderr){
            if (err) {
                return;
            }
            if (queueConfig.ackByProcessor) {
                channel.ack(message);
            }
        });

        if (!queueConfig.ackByProcessor) {
            channel.ack(message);
        }
    }
}
