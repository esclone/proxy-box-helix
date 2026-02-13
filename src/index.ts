import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { downloadCore, downloadCloudflared } from './features/download';
import { configType } from './types';
import { getConfig } from './features/config';
import { startCore, startCloudflared } from './features/start';
import { listenPort } from './features/listenPort';
import { connectCluster } from './features/cluster';

dotenv.config();
const app = express();
app.disable('x-powered-by');
let config: configType;

let pid_core = NaN,
  pid_cloudflared = NaN;

// Generate Status Codes
app.get('/generate_204', (req, res) => {
  res.status(204).send('');
});
app.get('/generate_200{*any}', (req, res) => {
  res.status(200).send('');
});

(async () => {
  config = await getConfig();
  app.use(
    config.path,
    createProxyMiddleware({
      target: `http://127.0.0.1:${config.middle_port}${config.network === 'ws' ? '' : config.path}`,
      changeOrigin: true,
      ws: true,
      logger: {
        info: (msg: any) => {
          // console.log(msg);
        },
        warn: (msg: any) => {
          // console.log(msg);
        },
        error: (msg: any) => {
          console.log(msg);
        },
      },
    }),
  );

  app.use(async (req, res, next) => {
    await proxyRemotePage(res, 'https://404.mise.eu.org/');
  });

  start();

  const clusterServer = connectCluster(config, async (ws, type, data) => {
    try {
      switch (type) {
        case 'refresh_config': {
          config = await getConfig();
          break;
        }
        case 'get_env': {
          ws.send(JSON.stringify({ type: 'get_env', data: process.env }));
          break;
        }
        case 'process_restart': {
          const ori_disable_exit_protect = config.disable_exit_protect;
          config.disable_exit_protect = true;
          if (!isNaN(pid_core)) process.kill(pid_core);
          if (!isNaN(pid_cloudflared)) process.kill(pid_cloudflared);
          pid_core = NaN;
          pid_cloudflared = NaN;
          config.disable_exit_protect = ori_disable_exit_protect;
          start(true);
          break;
        }
        case 'process_update': {
          const ori_disable_exit_protect = config.disable_exit_protect;
          config.disable_exit_protect = true;
          if (!isNaN(pid_core)) process.kill(pid_core);
          if (!isNaN(pid_cloudflared)) process.kill(pid_cloudflared);
          pid_core = NaN;
          pid_cloudflared = NaN;
          fs.rmSync(path.resolve(process.cwd(), config.core_path));
          fs.rmSync(path.resolve(process.cwd(), config.cloudflared_path));
          config.disable_exit_protect = ori_disable_exit_protect;
          start(true);
          break;
        }
        case 'push_tasks':
          (data as any[]).forEach(task => {});
          break;

        default:
          break;
      }
    } catch (error) {}
  });
})();

async function start(noListenPort = false) {
  console.log('[OS Info]', `${os.platform()} ${os.arch()}`);
  if (config.cloudflared_enabled) {
    if (!fs.existsSync(path.resolve(process.cwd(), config.cloudflared_path))) {
      const foo = await downloadCloudflared(config.cloudflared_path);
      if (foo) {
        console.log(
          '[Initialization]',
          'Cloudflared Download Success',
          `${Math.round((Number(foo) / 1024 / 1024) * 10) / 10} MB`,
        );
      } else {
        console.log('[Initialization]', 'Cloudflared Download Failed');
      }
    } else {
      console.log('[Initialization]', 'Cloudflared Already Exist');
    }
    const start_return = await startCloudflared(config);
    if (start_return.success) {
      pid_cloudflared = start_return.pid;
      console.log('[Main]', 'Cloudflared Start Success');
    } else {
      console.log('[Main]', 'Cloudflared Start Failed:', start_return.error);
      if (!config.disable_exit_protect) process.exit(1);
    }
  }

  if (!fs.existsSync(path.resolve(process.cwd(), config.core_path))) {
    const foo = await downloadCore(config.core_path);
    if (foo) {
      console.log(
        '[Initialization]',
        'Core Download Success',
        `${Math.round((Number(foo) / 1024 / 1024) * 10) / 10} MB`,
      );
    } else {
      console.log('[Initialization]', 'Core Download Failed');
    }
  } else {
    console.log('[Initialization]', 'Core Already Exist');
  }
  const start_return = await startCore(config);
  if (start_return.success) {
    pid_core = start_return.pid;
    console.log('[Main]', 'Core Start Success');
  } else {
    console.log('[Main]', 'Core Start Failed:', start_return.error);
    if (!config.disable_exit_protect) process.exit(1);
  }

  if (!noListenPort) listenPort(config, app);
}

async function proxyRemotePage(res, url: string, contentType = 'text/html; charset=utf-8') {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'proxy-box',
      },
    });

    res.status(r.status);
    res.setHeader('Content-Type', contentType);

    const text = await r.text();
    res.send(text);
  } catch (err) {
    res.status(502).send(`Remote page fetch failed: ${err.message}`);
  }
}
