var child_process = require('child_process');
module.exports = {
    work: function (message, queueConfig, channel) {
        console.log('message received on queue "' + queueConfig.name + '"');

        if (typeof queueConfig.processor == 'function') {
            var acknowledgeCallback = function(acknowledge) {
                if (queueConfig.acknowledgeByProcessor) {
                    if (acknowledge) {
                        channel.ack(message);
                    } else {
                        channel.reject(message, queueConfig.requeue);
                    }
                }
            };
            setTimeout(function () {
                var result = queueConfig.processor.call(null, message.content.toString(), queueConfig, acknowledgeCallback);
                if (queueConfig.acknowledgeByProcessor) {
                    if (result) {
                        channel.ack(message);
                    } else {
                        setTimeout(function () {
                            channel.reject(message, queueConfig.requeue);
                        }, 1000);
                    }
                }
            }, 0);

            return;
        }

        if (typeof queueConfig.processor == 'string') {
            var cmd = queueConfig.processor.replace('%message%', message.content.toString());

            child_process.exec(cmd, function (err, stdout, stderr) {
                if (err) {
                    console.error(err)

                    setTimeout(function () {
                        channel.reject(message, queueConfig.requeue);
                    }, 1000);

                    return;
                }
                console.log(stdout);
                channel.ack(message);
            });
        }
    }
};
