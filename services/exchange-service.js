module.exports = function() {
    var async = require('async');
        configureExchange = function(channel, exchangeConfig) {
            channel.assertExchange(
                exchangeConfig.name,
                exchangeConfig.type,
                {
                    durable: exchangeConfig.durable != undefined ? exchangeConfig.durable : true
                }
            );
        };

    return {
        configureExchanges: function(exchanges, channel) {
            async.each(exchanges, function(exchangeConfig) {
                configureExchange(channel, exchangeConfig);
            });
        }
    }
}();
