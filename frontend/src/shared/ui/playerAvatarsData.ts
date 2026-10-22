export const KNOWN_PLAYER_AVATARS: Record<string, { format: 'png' | 'jpg'; path: string }> = {
  donk: { format: 'png', path: '/images/players/donk.png' },
  chopper: { format: 'jpg', path: '/images/players/chopper.jpg' },
  zont1x: { format: 'png', path: '/images/players/zont1x.png' },
  magixx: { format: 'jpg', path: '/images/players/magixx.jpg' },
  sh1ro: { format: 'png', path: '/images/players/sh1ro.png' },
  apex: { format: 'jpg', path: '/images/players/apex.jpg' },
  zywoo: { format: 'png', path: '/images/players/zywoo.png' },
  magisk: { format: 'jpg', path: '/images/players/magisk.jpg' },
  mezii: { format: 'png', path: '/images/players/mezii.png' },
  ropz: { format: 'jpg', path: '/images/players/ropz.jpg' },
  yuurih: { format: 'jpg', path: '/images/players/yuurih.jpg' },
  kscerato: { format: 'png', path: '/images/players/kscerato.png' },
  fallen: { format: 'jpg', path: '/images/players/fallen.jpg' },
  saffee: { format: 'png', path: '/images/players/saffee.png' },
  art: { format: 'jpg', path: '/images/players/art.jpg' },
  s1mple: { format: 'png', path: '/images/players/s1mple.png' },
  xertion: { format: 'jpg', path: '/images/players/xertion.jpg' },
  jimpphat: { format: 'png', path: '/images/players/jimpphat.png' },
  torzsi: { format: 'jpg', path: '/images/players/torzsi.jpg' },
  brollan: { format: 'png', path: '/images/players/brollan.png' },
}

export function getKnownPlayerAvatar(playerIdOrName: string): string | undefined {
  const normalized = playerIdOrName.toLowerCase().trim()
  return KNOWN_PLAYER_AVATARS[normalized]?.path
}
