import os from 'os';
import path from 'path';
import cp from 'child_process';
import stream from 'stream';
import CoreConfigHandler from './coreConfigHandler';
import { configType } from '../types';

export async function startCore(config: configType): Promise<{ success: boolean; pid?: number; error?: any }> {
  // Generate config for core
  let extra = {};
  if (config.warp_secretKey && config.warp_ipv6 && (config.add_ipv4 || config.add_ipv6)) {
    let domainStrategy = 'IPIfNonMatch';
    let extra_iprules: any = [
      {
        type: 'field',
        ip: ['0.0.0.0/0'],
        outboundTag: config.add_ipv4 ? 'wireguard' : 'direct',
      },
      {
        type: 'field',
        ip: ['::/0'],
        outboundTag: config.add_ipv6 ? 'wireguard' : 'direct',
      },
    ];
    if (config.add_ipv4 && config.add_ipv6) {
      domainStrategy = 'AsIs';
      extra_iprules = [
        {
          type: 'field',
          port: '0-65535',
          outboundTag: 'wireguard',
        },
      ];
    }
    extra = {
      OutboundCustom: [
        {
          protocol: 'freedom',
          settings: {},
          tag: 'direct',
        },
        {
          protocol: 'blackhole',
          settings: {},
          tag: 'blocked',
        },
        {
          protocol: 'wireguard',
          settings: {
            kernelMode: false,
            secretKey: config.warp_secretKey,
            address: [config.warp_ipv4 + '/32', config.warp_ipv6 + '/128'],
            peers: [
              {
                publicKey: config.warp_publicKey,
                endpoint: config.warp_endpoint,
              },
            ],
            reserved: config.warp_reserved,
            mtu: 1420,
          },
          tag: 'wireguard',
        },
      ],
      RoutingCustom: {
        domainStrategy: domainStrategy,
        rules: [
          ...extra_iprules,
          {
            outboundTag: 'blocked',
            protocol: ['bittorrent'],
            type: 'field',
          },
        ],
      },
      DnsServerCustom: ['tcp+local://8.8.8.8'],
    };
  }

  let config_obj: any = new CoreConfigHandler().generateServerConfig({
    InboundPort: config.middle_port,
    InboundAddress: '127.0.0.1',
    sniffingEnabled: false,
    InboundProtocol: Buffer.from(config.protocol, 'base64').toString(),
    InboundUUID: config.uuid,
    InboundStreamType: config.network as any,
    InboundEncryption: 'auto',
    InboundStreamSecurity: 'none',
    InboundPath: config.path,
    ...extra,
  });
  config_obj = JSON.stringify(config_obj, null, '');
  // console.log(config_obj);

  await (_ => {
    return new Promise(async resolve => {
      if (os.platform() != 'linux') {
        resolve(null);
        return;
      }
      let args = ['+x', path.resolve(process.cwd(), config.core_path)];
      let processC = cp.spawn('chmod', args);
      processC.on('close', () => {
        console.log('[Initialization]', 'Core chmod Compeleted');
        setTimeout(() => {
          resolve(null);
        }, 100);
      });
    });
  })();
  let processC = cp.spawn(path.resolve(process.cwd(), config.core_path), ['-c', 'stdin:']);
  processC.on('exit', (code, signal) => {
    console.log('[Main]', `Core exited with code ${code}, signal ${signal}`);
    if (!config.disable_exit_protect) process.exit(1);
  });

  let stdInStream = new stream.Readable();
  stdInStream.push(config_obj);
  stdInStream.push(null);
  stdInStream.pipe(processC.stdin);
  return new Promise(resolve => {
    processC.stdout.on('data', data => {
      // console.log(data.toString().trim());
      if (/\[Warning\] core: .* started/.test(data)) {
        resolve({ success: true, pid: processC.pid });
      }
    });
    processC.on('error', error => {
      resolve({ success: false, error });
    });
  });
}

export async function startCloudflared(config: configType): Promise<{ success: boolean; pid?: number; error?: any }>  {
  await (_ => {
    return new Promise(async resolve => {
      if (os.platform() != 'linux') {
        resolve(null);
        return;
      }
      let args = ['+x', path.resolve(process.cwd(), config.cloudflared_path)];
      let processC = cp.spawn('chmod', args);
      processC.on('close', () => {
        console.log('[Initialization]', 'Cloudflared chmod Compeleted');
        setTimeout(() => {
          resolve(null);
        }, 100);
      });
    });
  })();

  let args = ['--url', `http://localhost:${config.port}`];
  if (config.cloudflared_access_token) {
    args = ['run', '--token', config.cloudflared_access_token];
    console.log('[Cloudflared Config]', 'Domain: Custom Token');
  }
  if (config.cloudflared_protocol) {
    args.push('--protocol', config.cloudflared_protocol);
  }
  if (config.cloudflared_region) {
    args.push('--region', config.cloudflared_region);
  }
  let processC = cp.spawn(path.resolve(process.cwd(), config.cloudflared_path), ['tunnel', '--no-autoupdate', ...args]);
  processC.on('exit', (code, signal) => {
    console.log('[Main]', `Cloudflared exited with code ${code}, signal ${signal}`);
    if (!config.disable_exit_protect) process.exit(1);
  });

  return new Promise(resolve => {
    processC.stderr.on('data', data => {
      // https://.*[a-z]+cloudflare.com
      if (/Registered tunnel connection/.test(data)) {
        console.log(
          '[Cloudflared Info]',
          data
            .toString()
            .match(/(?<=Registered tunnel connection).*/)[0]
            .trim(),
        );
      } else if (!config.cloudflared_access_token && /https:\/\/.*[a-z]+cloudflare.com/.test(data)) {
        console.log(
          '[Cloudflared Config]',
          `Domain: ${data.toString().match(/(?<=https:\/\/).*[a-z]+cloudflare.com/)[0]}`,
        );
      } else {
        // console.log(data.toString().trim());
      }
      resolve({ success: true, pid: processC.pid });
    });
    processC.on('error', error => {
      console.log('[Cloudflared Error]', error);
      resolve({ success: false, error });
    });
  });
}
