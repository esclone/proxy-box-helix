import axios from 'axios';
import { configType } from '../../types';
import WebSocket from 'ws';
import { getProjectVersion } from '../version';

export async function getClusterConfig(config: configType) {
  if (!config.cluster_enabled || !config.cluster_server_url) {
    return {};
  }

  return {
    ...(await getConfig(config.cluster_server_url, config.cluster_client_uuid, config.cluster_server_auth)),
    cluster_enabled: config.cluster_enabled,
    cluster_server_url: config.cluster_server_url,
    cluster_server_auth: config.cluster_server_auth,
    cluster_client_uuid: config.cluster_client_uuid,
    cluster_exec_enabled: config.cluster_exec_enabled,
  };
}

export async function getConfig(url: string, uuid: string, auth?: string) {
  const response: JSON = await axios.get(url + `/config?uuid=${uuid}`, {
    headers: {
      Authorization: 'Bearer ' + auth,
    },
  });
  console.log('[Initialization]', 'Obtain cluster configuration successfully');
  return response;
}

export function getClusterWebsocket(url: string) {
  return url.replace(/^http/, 'ws');
}

export function connectCluster(config: configType, msgHandler?: (ws: WebSocket, type: string, data: any) => void) {
  if (!config.cluster_enabled || !config.cluster_server_url) {
    return undefined;
  }

  const wsBaseUrl = getClusterWebsocket(config.cluster_server_url);
  const version = getProjectVersion();

  let ws: WebSocket | null = null;
  let timer: NodeJS.Timeout | null = null;
  let closedByUser = false;

  const connect = () => {
    const url = `${wsBaseUrl}/connection?uuid=${config.cluster_client_uuid}&version=${version}`;

    ws = new WebSocket(url);

    ws.on('open', () => {
      console.log('[Cluster] Server connected');
      ws!.send('ping');
      if (process.env.RENDER_EXTERNAL_URL) {
        ws.send(JSON.stringify({ type: 'keepalive_url', data: process.env.RENDER_EXTERNAL_URL + '/generate_200' }));
      }
    });

    ws.on('message', buf => {
      try {
        const msg = JSON.parse(buf.toString());
        msgHandler?.(ws, msg.type, msg.data);
      } catch {}
    });

    ws.on('close', () => {
      console.log('[Cluster] Server closed');

      if (!closedByUser) {
        reconnect();
      }
    });

    ws.on('error', err => {
      console.error('[Cluster]', err);
      ws?.close(); // 统一走 close → reconnect
    });
  };

  const reconnect = () => {
    if (timer) return;

    console.log('[Cluster] reconnecting in 10s...');

    timer = setTimeout(() => {
      timer = null;
      connect();
    }, 10_000);
  };

  const close = () => {
    closedByUser = true;
    timer && clearTimeout(timer);
    ws?.close();
  };

  connect();

  return {
    get ws() {
      return ws;
    },
    close,
  };
}
