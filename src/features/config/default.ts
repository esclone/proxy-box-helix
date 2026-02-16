import os from 'os';
import { configType } from '../../types';

const config: configType = {
  cluster_enabled: false,
  cluster_client_uuid: 'default',
  cluster_exec_enabled: false,

  debug: false,
  port: 3000,
  middle_port: 58515,
  core_path: os.platform() == 'win32' ? './core.exe' : './core',
  disable_exit_protect: false,

  protocol: Buffer.from('dmxlc3M=', 'base64').toString(),
  network: 'xhttp', // Tested: ws/xhttp
  uuid: 'api',
  decryption: 'none',
  path: '/api',

  xhttp_extra: {
    // shouldn't modify this by default
    // xPaddingBytes: '1',
    scMaxEachPostBytes: '100000000', // 100 MB, packet-up only
    scStreamUpServerSecs: '90', // stream-up, server only
  },

  tls_enabled: false,

  warp_add_ipv4: false,
  warp_add_ipv6: false,
  warp_ipv4: '172.16.0.2',
  warp_reserved: [0, 0, 0],
  warp_publicKey: 'bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=',
  warp_endpoint: 'engage.cloudflareclient.com:2408',
  warp_routing: 'auto',

  cloudflared_enabled: false,
  cloudflared_path: os.platform() == 'win32' ? './cloudflared.exe' : './cloudflared',
  cloudflared_protocol: 'auto', // [auto]/quic/http2
  cloudflared_region: '', // none/us
};

export default config;
