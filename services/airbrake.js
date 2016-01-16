(function() {
    var
        airbrakeConfig = manifest.getAirbrakeConfig(),
        airbrake = require('airbrake').createClient(airbrakeConfig.projectKey, airbrakeConfig.environment);

    airbrake.handleExceptions();
    module.exports = airbrake;
})();
