import fs from 'fs';
import { configType } from '../../types';
import defaultConfig from './default';

export function getConfig() {
  let config_json: configType;
  try {
    config_json = JSON.parse(process.env.CONFIG);
  } catch {
    try {
      config_json = JSON.parse(fs.readFileSync('./config.json').toString());
    } catch {
      console.log('[Main]', `Config Error`);
      config_json = {} as any;
    }
  }

  return {
    ...defaultConfig,
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
