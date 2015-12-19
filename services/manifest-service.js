module.exports = function(manifest) {
    return {
        getConnectionConfig: function() {
            return {
                parameters: manifest.amqp.connection,
                getConnectionString: function() {
                    return 'amqp://'
                            + manifest.amqp.connection.username
                            + ':'
                            + manifest.amqp.connection.password
                            + '@'
                            + manifest.amqp.connection.host
                            + ':'
                            + manifest.amqp.connection.port;
                }
            };
        },
        getExchangeConfig: function() {
            return manifest.amqp.exchanges;
        },
        getQueueConfig: function() {
            return manifest.amqp.queues;
        }
    };
};
