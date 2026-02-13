import fs from 'fs';
import { configType } from '../../types';
import defaultConfig from './default';
import { getClusterConfig } from '../cluster';

export async function getConfig() {
  let config = getConfigLocally();
  config = { ...config, ...(await getClusterConfig(config)) };
  return config;
}

export function editConfig(config: configType, updated: Record<string, any>) {
  for (const key in updated) {
    const element = updated[key];
    config[key] = element;
  }
}

export function getConfigLocally() {
  let config_json: configType;
  let cluster_config: {
    cluster_enabled?: boolean;
    cluster_server_url?: string;
    cluster_server_auth?: string;
    cluster_client_uuid?: string;
    cluster_exec_enabled?: boolean;
  } = {};
  try {
    config_json = JSON.parse(process.env.CONFIG);
  } catch {
    try {
      config_json = JSON.parse(fs.readFileSync('./config.json').toString());
    } catch {
      config_json = {} as any;
    }
  }
  try {
    if (process.env.CLUSTER) {
      let CLUSTER = process.env.CLUSTER;
      let splits = CLUSTER.split(';');
      cluster_config = {
        cluster_enabled: true,
        cluster_server_url: splits[0],
        cluster_server_auth: splits[1],
        cluster_client_uuid: splits[2] ?? defaultConfig.cluster_client_uuid,
        cluster_exec_enabled: Boolean(splits[3]),
      };
    }
  } catch (error) {}

  return {
    ...defaultConfig,
    ...cluster_config,
    ...config_json,

    // please use base64 encode
    tls_key: config_json.tls_key && Buffer.from(config_json.tls_key, 'base64').toString(),
    tls_cert: config_json.tls_cert && Buffer.from(config_json.tls_cert, 'base64').toString(),
    warp_reserved:
      typeof config_json.warp_reserved === 'string'
        ? decodeClientId(config_json.warp_reserved)
        : defaultConfig.warp_reserved,
  } as configType;
}

function decodeClientId(clientId: string) {
  const decodedBuffer = Buffer.from(clientId, 'base64');
  const hexString = decodedBuffer.toString('hex');
  const hexPairs = hexString.match(/.{1,2}/g) || [];
  const decimalArray = hexPairs.map(hex => parseInt(hex, 16));
  return decimalArray;
}
