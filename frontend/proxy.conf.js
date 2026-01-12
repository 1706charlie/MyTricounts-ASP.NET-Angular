const PROXY_CONFIG = [{
    context: [
        "/rpc"
    ],
    target: 'http://localhost:3000',
    secure: false,
}]

module.exports = PROXY_CONFIG;
