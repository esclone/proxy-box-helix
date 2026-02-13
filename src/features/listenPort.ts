import http from 'http';
import https from 'https';
import express from 'express';
import { configType } from '../types';

export function listenPort(config: configType, expressApp: express.Express) {
  let serverProxy: undefined | http.Server | https.Server;
  if (config.tls_enabled) {
    console.log('[Main]', `Https Enabled`);
    if (config.tls_cert && config.tls_key) {
      const options = {
        key: config.tls_key,
        cert: config.tls_cert,
      };
      serverProxy = https.createServer(options, expressApp);
    } else {
      console.log('[Main]', `Https Missing: tls_cert,tls_key`);
    }
  } else {
    serverProxy = http.createServer(expressApp);
  }
  function try_connect(serverProxy: undefined | http.Server | https.Server) {
    serverProxy.listen(config.port, () => {
      console.log('[Main]', `Listening on Port ${config.port}`);
    });
  }
  try_connect(serverProxy);
  serverProxy.on('error', e => {
    if (e.code === 'EADDRINUSE') {
      console.error('[Main]', 'Listening Port Failed: Address in use, retrying...');
      setTimeout(() => {
        serverProxy.close();
        try_connect(serverProxy);
      }, 1000);
    }
  });
}
