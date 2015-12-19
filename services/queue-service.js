module.exports = function() {
    var exec = require('child_process').exec,
        configureQueue = function(channel, queueConfig) {
            channel.assertQueue(
                queueConfig.name,
                {
                    durable: queueConfig.durable != undefined ? queueConfig.durable : true
                },
                function(error, queue) {
                    if (error) {
                        throw('Queue could not be asserted: "' + error + '"');
                    }
                    onQueueAsserted(queue, queueConfig, channel);
                }
            );
        },
        onQueueAsserted = function(queue, queueConfig, channel) {
            channel.prefetch(1);
            queueConfig.routingKeys.forEach(function (routingKey) {
                channel.bindQueue(
                    queueConfig.name, queueConfig.exchange, routingKey
                );
            });

            channel.consume(queueConfig.name, function(message) {
                if (typeof queueConfig.processor == 'string') {
                    // Convert to javascript process
                    if (queueConfig.async) {
                        // Async process
                        var cmd = message.replace('%message%', message.content.toString());
                        exec(cmd,
                            function (error, stdout, stderr) {
                                console.log('stdout: ' + stdout);
                                console.log('stderr: ' + stderr);
                                if (error !== null) {
                                    console.log('exec error: ' + error);
                                }
                            });
                        channel.ack(message);
                    }

                }
            });
            console.log('Start consuming on queue ' + queueConfig.name)
        };

    return {
        consume: function(queues, channel) {
            queues.forEach(function(queueConfig) {
                configureQueue(channel, queueConfig);
            });
        }
    };
}();
