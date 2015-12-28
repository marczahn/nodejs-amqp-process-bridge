var queueConfig = function(config) {
    return {
        getRoutingKeys: function() {
            return config.routingKeys;
        },
        getPrefetchCount: function() {
            return config.prefetch || 1;
        },
        isRequeuing: function() {
            return config.requeue || true;
        },
        isAutoAck: function() {
            return config.autoAck || false;
        },
        isDurable: function() {
            return config.durable || true;
        },
        getProcessor: function() {
            return config.processor;
        },
        getExchange: function() {
            return config.exchange;
        }
    };
};

var exchangeConfig = function(config) {
    return {
    };
}

module.exports = function(manifest) {
    var queueConfigs = [];
    for (var i in manifest.queues) {
        queueConfigs.push(new QueueConfig(manifest.queues[i]);
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
        getExchangeConfig: function() {
            return manifest.exchanges;
        },
        getQueueConfig: function() {
            return queueConfigs;
        }
    };
};
