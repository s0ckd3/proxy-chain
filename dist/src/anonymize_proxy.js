"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenConnectAnonymizedProxy = exports.closeAnonymizedProxy = exports.anonymizeProxy = void 0;
const server_1 = require("./server");
const nodeify_1 = require("./utils/nodeify");
// Dictionary, key is value returned from anonymizeProxy(), value is Server instance.
const anonymizedProxyUrlToServer = {};
/**
 * Parses and validates a HTTP proxy URL. If the proxy requires authentication, then the function
 * starts an open local proxy server that forwards to the upstream proxy.
 */
const anonymizeProxy = (proxyUrl, port) => {
    let server;
    const startServer = () => {
        return Promise.resolve()
            .then(() => {
            server = new server_1.Server({
                // verbose: true,
                port: port,
                prepareRequestFunction: () => {
                    return {
                        requestAuthentication: false,
                        upstreamProxyUrl: proxyUrl,
                    };
                },
            });
            return server.listen();
        });
    };
    const promise = startServer()
        .then(() => {
        const url = `http://127.0.0.1:${server.port}`;
        anonymizedProxyUrlToServer[url] = server;
        return url;
    });
    return (0, nodeify_1.nodeify)(promise);
};
exports.anonymizeProxy = anonymizeProxy;
/**
 * Closes anonymous proxy previously started by `anonymizeProxy()`.
 * If proxy was not found or was already closed, the function has no effect
 * and its result if `false`. Otherwise the result is `true`.
 * @param closeConnections If true, pending proxy connections are forcibly closed.
 */
const closeAnonymizedProxy = (anonymizedProxyUrl, closeConnections, callback) => {
    if (typeof anonymizedProxyUrl !== 'string') {
        throw new Error('The "anonymizedProxyUrl" parameter must be a string');
    }
    const server = anonymizedProxyUrlToServer[anonymizedProxyUrl];
    if (!server) {
        return (0, nodeify_1.nodeify)(Promise.resolve(false), callback);
    }
    delete anonymizedProxyUrlToServer[anonymizedProxyUrl];
    const promise = server.close(closeConnections)
        .then(() => {
        return true;
    });
    return (0, nodeify_1.nodeify)(promise, callback);
};
exports.closeAnonymizedProxy = closeAnonymizedProxy;
/**
 * Add a callback on 'tunnelConnectResponded' Event in order to get headers from CONNECT tunnel to proxy
 * Useful for some proxies that are using headers to send information like ProxyMesh
 * @returns `true` if the callback is successfully configured, otherwise `false` (e.g. when an
 * invalid proxy URL is given).
 */
const listenConnectAnonymizedProxy = (anonymizedProxyUrl, tunnelConnectRespondedCallback) => {
    const server = anonymizedProxyUrlToServer[anonymizedProxyUrl];
    if (!server) {
        return false;
    }
    server.on('tunnelConnectResponded', ({ response, socket, head }) => {
        tunnelConnectRespondedCallback({ response, socket, head });
    });
    return true;
};
exports.listenConnectAnonymizedProxy = listenConnectAnonymizedProxy;
//# sourceMappingURL=anonymize_proxy.js.map