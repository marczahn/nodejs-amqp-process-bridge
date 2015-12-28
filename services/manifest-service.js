var extend = require('extend'),
    QueueConfig = function(config) {
        return extend(
            {
                prefetch: 1,
                routingKeys: [],
                consumers: 1,
                requeue: true,
                autoAck: false,
                durable: true,
                exchange: 'default',
                processor: function() {
                    throw('No processor implemented');
                }
            },
            config
        );
    },
    ExchangeConfig = function(config) {
        return extend(
            {
                name: 'default',
                type: 'topic',
                internal: false,
                durable: true,
                autoDelete: false,
                arguments: {
                    'x-ha-mode': 'all'
                }
            },
            config
        );
    };

module.exports = function(manifest) {
    var exchangeConfigs = [],
        queueConfigs = [];
    for (var i in manifest.exchanges) {
        exchangeConfigs.push(new ExchangeConfig(manifest.exchanges[i]));
    }
    for (var i in manifest.queues) {
        queueConfigs.push(new QueueConfig(manifest.queues[i]));
    }
    return {
        getConnectionConfig: function() {
            return {
                parameters: manifest.connection,
                getConnectionString: function() {
                    return 'amqp://'
                            + manifest.connection.username
                            + ':'
                            + manifest.connection.password
                            + '@'
                            + manifest.connection.host
                            + ':'
                            + manifest.connection.port;
                }
            };
        },
        getExchangeConfigs: function() {
            return exchangeConfigs;
        },
        getQueueConfigs: function() {
            return queueConfigs;
        }
    };
};
