(function() {
    var child_process = require('child_process'),
        javascriptWorker = function(message, queueConfig, channel) {
            work = function () {
                var result = queueConfig.processor.call(null, message.content.toString(), queueConfig);
                if (!queueConfig.autoAck) {
                    if (result) {
                        channel.ack(message);
                    } else {
                        channel.nack(message);
                    }
                }
            };
            
            setTimeout(work, 0);
        },
        cmdWorker = function(message, queueConfig, channel) {
            var cmd = queueConfig.processor.replace('%message%', message.content.toString());
            child_process.exec(cmd, function (err, stdout, stderr) {
                if (!err) {
                    if (!queueConfig.autoAck) {
                        channel.ack(message);
                    }

                    return;
                }
                if (!queueConfig.autoAck) {
                    channel.nack(message);
                }
            });
        };
        
    module.exports = {
        work: function (message, queueConfig, channel) {
            if (queueConfig.autoAck) {
                channel.ack(message);
            }

            if (typeof queueConfig.processor == 'function') {
                javascriptWorker(message, queueConfig, channel);
                
                return;
            }
            
            cmdWorker(message, queueConfig, channel);
        }
    };
})();
