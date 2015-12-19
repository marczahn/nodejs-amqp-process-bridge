module.exports = function(manifest) {
    var amqp = require('amqplib/callback_api'),
        exchangeService = require('./exchange-service'),
        queueService = require('./queue-service'),
        createConnection = function(callback) {
                connection = amqp.connect(manifest.getConnectionConfig().getConnectionString(), callback);
        },
        run = function(connection) {
            connection.createChannel(function(error, channel) {
                if (error) {
                    throw('Channel could not be opened: "' + error + '"')
                }
                exchangeService.configureExchanges(manifest.getExchangeConfig(), channel);
                queueService.consume(manifest.getQueueConfig(), channel);
            })
        };

    // TODO - Interval checking config

    return {
        run: function() {
            createConnection(function(error, connection) {
                if (error) {
                    throw('Connection could to RabbitMQ server could not be established: "' + error + '"')
                }
                run(connection);
            });
        }
    };
};
