(function() {
    var amqp = require('amqplib'),
        connectionService = require('./services/connection-service.js'),
        connectionHandler = require('./services/connection-handler'),
        configService = require('./services/config-service'),
        appContext = this,
        run = function(configFile) {
            var 
                config = configService.create(configFile);
                connectionOpened = connectionService.create(config.getConnectionConfig());
            
            connectionOpened.then(function(connection) {
                connection.on('close', function(error) {
                    if (error == 'Closed by client') {
                        return;
                    }
                    console.log('Error occured: ' + error);
                    setTimeout(
                        function() {
                            run.call(appContext, configFile);
                        },
                        1000
                    );
                });
            });
            connectionOpened.then(function(connection) {
                connectionHandler.handle(connection, config);
                
                process.once('SIGINT', function() {
                    console.log('Closing connection...');
                    var connectionClosed = connection.close();
                    connectionClosed.then(function() {
                        console.log('Connection closed');
                    })
                });
            });
        };
        
        process.on('uncaughtException', function(error) {
            'Uncought exception';
            console.log(error);
        });
        
        module.exports = {
            run: function(configFile) {
                run(configFile);
            }
        };
})();