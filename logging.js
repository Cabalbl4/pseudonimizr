let logger = console;
module.exports = {
    setLogger(newLogger) { logger = newLogger },
    getLogger() { return logger },
}