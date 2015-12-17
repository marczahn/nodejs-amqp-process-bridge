module.exports = function() {
    var async = require('async');

    var loadExchange = function(channel, exchangeConfig) {
        channel.assertExchange(
            exchangeConfig.name,
            exchangeConfig.type,
            {durable: exchangeConfig.durable != undefined ? exchangeConfig.durable : true}
        );
    }

    return {
        init: function(channel) {
            async.forEach(config.rabbitmq.exchanges, function(exchangeConfig) {
                loadExchange(channel, exchangeConfig);
            });
        }
    }
}();
