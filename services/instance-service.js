module.exports = function(configFile) {
    var fs = require('fs'),
        md5 = require('md5'),
        currentConfigFileHash = '',
        yaml = require('js-yaml'),
        amqp = require('amqplib'),
        //connectionString = 'amqp://' + config.amqp.connection.host + ':' + config.amqp.connection.port,
        //connectionOpened = amqp.connect(connectionString);
        config = yaml.safeLoad(getConfigFileContent());

    var isConfigUpdated = function(configFileHash) {
        return configFileHash != getConfigHash;
    }

    var getConfigHash = function() {
        return md5(getConfigFileContent());
    }

    var getConfigFileContent = function() {
        return fs.readfileSync(configFile);
    }

    // TODO - Start connection and so on

    // TODO - Interval checking config

    return {
        run: function() {

        }
    };
};
