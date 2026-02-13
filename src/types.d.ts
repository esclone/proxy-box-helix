export declare type configType = {
  cluster_enabled: boolean;
  cluster_server_url?: string;
  cluster_server_auth?: string;
  cluster_client_uuid: string;
  cluster_exec_enabled: boolean;

  debug: boolean;
  port: number;
  middle_port: number;
  core_path: string;
  disable_exit_protect: boolean;

  // Base protocol
  protocol: string;
  // Transfer protocol
  network: string;
  uuid: string;
  decryption: string;
  path: string;

  xhttp_extra?: any;

  // Part: TLS
  tls_enabled: boolean;
  tls_key?: string; // Base64 encodeed
  tls_cert?: string; // Base64 encodeed

  // Part: Warp
  warp_add_ipv4: boolean;
  warp_add_ipv6: boolean;
  warp_ipv4: string;
  warp_ipv6?: string;
  warp_reserved: number[] | string;
  warp_publicKey: string;
  warp_secretKey?: string;
  warp_endpoint: string;
  warp_routing: string;

  // Part: Cloudflared
  cloudflared_enabled: boolean;
  cloudflared_path: string;
  cloudflared_protocol: string;
  cloudflared_region?: string;
  cloudflared_access_token?: string;
};
