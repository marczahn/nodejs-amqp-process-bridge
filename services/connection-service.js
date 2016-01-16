(function() {
    var amqp = require('amqplib');
    
    module.exports = {
        create: function(config) {
            return amqp.connect(config.getConnectionString());
        }
    };
})();