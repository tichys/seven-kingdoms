const ICON_PATHS = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  sword: 'M14.5 2.5L21 9l-9 9-6.5-6.5L14.5 2.5zM3 21l4-4M7 17l-4 4',
  crown: 'M2 18h20M2 18l3-11 5 6 2-8 2 8 5-6 3 11',
  raven: 'M12 2C8 2 6 5 6 8c0 2 1 4 3 5l-4 4v3h2l4-3 1 3 1-3 4 3h2v-3l-4-4c2-1 3-3 3-5 0-3-2-6-6-6z',
  flame: 'M12 2c0 0-5 4-5 10 0 4 2 8 5 8s5-4 5-8c0-4-3-6-3-6s1 3-1 4c0-3-1-5-1-8z',
  dragon: 'M3 12c2-6 8-8 12-4 2 2 4 4 6 4-2 2-4 4-8 4-4 0-8-2-10-4z M9 8l-3-3M15 8l3-3',
  wolf: 'M12 4L8 8H4l2 4-2 8h4l4-4 4 4h4l-2-8 2-4h-4z',
  lion: 'M12 2c-2 0-4 2-4 4 0 2 2 4 4 4s4-2 4-4c0-2-2-4-4-4zM6 10c-2 0-4 2-4 4s2 4 4 4M18 10c2 0 4 2 4 4s-2 4-4 4M8 14c0 4 2 8 4 8s4-4 4-8',
  rose: 'M12 2c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zM12 8c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zM12 12c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z',
  kraken: 'M12 4c-2 0-4 2-4 4 0 1 0 2 1 3l-5 5 3 1 2-2v4l3-2 3 2v-4l2 2 3-1-5-5c1-1 1-2 1-3 0-2-2-4-4-4z',
  stag: 'M12 2L8 6H6v2L4 10h2l-2 4h4l-2 8h4l4-4 4 4h4l-2-8h4l-2-4h2L18 8V6h-2z',
  trout: 'M4 12c4-6 12-6 16 0-4 6-12 6-16 0zM2 12l4-4v8zM18 8l4 4-4 4',
  falcon: 'M12 2L8 8H4l2 4-4 8h4l6-6 6 6h4l-2-8 2-4h-4z',
  sun: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 2v2M12 20v2M4 12H2M22 12h-2M6 6L4 4M20 4l-2 2M6 18l-2 2M20 20l-2-2',
  flayed: 'M12 2c-3 0-6 3-6 8 0 4 3 12 6 12s6-8 6-12c0-5-3-8-6-8z M9 6c0 2 1 3 3 3s3-1 3-3',
  viper: 'M4 12c0-4 4-8 8-8s8 4 8 8c0 2-2 4-4 4l-2 2-2 4-2-2-4-4c-2 0-2-2-2-4z',
  onion: 'M12 2C8 2 6 6 6 12s2 10 6 10 6-4 6-10S16 2 12 2z M10 8c0 2 1 4 2 4s2-2 2-4',
  bear: 'M12 4c-3 0-6 3-6 8 0 6 3 10 6 10s6-4 6-10c0-5-3-8-6-8zM8 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z M14 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z',
  scroll: 'M6 4h12v16H6zM6 4c-2 0-2 0-2 2v12c0 2 0 2 2 2M18 4c2 0 2 0 2 2v12c0 2 0 2-2 2',
  quill: 'M20 2L8 14l-4 6 6-4L22 4zM18 6l-2 2',
  seal: 'M12 2a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4zM8 14v6l4-2 4 2v-6',
  banner: 'M6 2v20M6 4h12l-2 4 2 4H6M18 8l2 4-2 4',
  helm: 'M4 8c0-4 4-6 8-6s8 2 8 6v8H4zM4 16h16v4H4zM8 20v2M16 20v2',
  axe: 'M14 4l6 6-4 4-6-6M4 14l6 6 6-6-6-6',
  bow: 'M4 2c4 8 4 12 0 20M4 12h10l6 2-6 2h-10',
  gate: 'M4 6h16v14H4zM4 6l8-4 8 4M8 10v8M12 10v8M16 10v8',
  key: 'M14 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM14 14l6 6M18 18l2-2M16 16l4 4',
  coin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6l-2 4h4l-2 4',
  skull: 'M12 2C7 2 4 6 4 11c0 3 2 5 2 7h12c0-2 2-4 2-7 0-5-3-9-8-9zM8 10h2M14 10h2M10 16h4',
  heart: 'M12 21l-8-8a5 5 0 0 1 8-7 5 5 0 0 1 8 7z',
  star: 'M12 2l3 7h7l-5 4 2 7-7-4-7 4 2-7-5-4h7z',
  eye: 'M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  scrollOpen: 'M4 4h7v16H4zM13 4h7v16h-7zM4 4c0-2 0-2 2-2M20 4c0-2 0-2-2-2',
  chalice: 'M6 2h12l-2 8a4 4 0 0 1-8 0zM12 10v8M8 20h8M6 2L4 4M18 2l2 4',
  book: 'M4 4h6v16H4zM14 4h6v16h-6zM4 4c0-2 0-2 2-2h4v2M14 4c0-2 0-2 2-2h4v2',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6l2 6-2 6-2-6z',
  hourglass: 'M6 2h12v6l-6 4-6-4zM6 22h12v-6l-6-4-6 4zM6 8c0 2 2 4 6 4s6-2 6-4',
  flag: 'M4 2v20M4 4h12l-2 4 2 4H4',
  scales: 'M12 3v18M6 21h12M4 7h16M4 7l-2 6h4zM20 7l-2 6h4zM4 7c0 3 2 5 4 5s0-5 0-5M16 7c0 3 2 5 4 5s0-5 0-5',
  anchor: 'M12 2a3 3 0 0 0-3 3c0 1 0 2 1 3M12 2a3 3 0 0 1 3 3c0 1 0 2-1 3M12 8v10M6 14c0 4 3 6 6 6s6-2 6-6M3 14h3M18 14h3',
  tower: 'M4 8h16v14H4zM4 8l4-6h8l4 6M8 2v6M16 2v6M8 14h8M8 18h8',
  castle: 'M3 22h18M5 22V10l2-2v-4l2 2v4l2-2v-4l2 2v4l2-2v-4l2 2v4l2 2v12M9 22v-4h4v4M15 22v-4h2v4',
  tent: 'M12 4L2 20h20zM12 4v16',
  fire: 'M12 2c0 0-5 4-5 10 0 4 2 8 5 8s5-4 5-8c0-4-3-6-3-6s1 3-1 4c0-3-1-5-1-8z',
  ice: 'M12 2v20M4 6l16 12M4 18L20 6M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3',
  mountain: 'M3 20L9 8l4 6 3-4 5 10zM9 8l-2-4h4z',
  tree: 'M12 2L6 10h3v10h6V10h3zM6 10c-2 0-4 2-4 4s2 4 4 4M18 10c2 0 4 2 4 4s-2 4-4 4',
  wheat: 'M12 2v20M12 6l-4-2M12 6l4-2M12 10l-4-2M12 10l4-2M12 14l-4-2M12 14l4-2',
  gold: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6l-2 4h4l-2 4M10 10h4',
  goldCoins: 'M8 10a6 6 0 1 0 0-4 6 6 0 0 0 0 4zM8 6c0 2 2 4 4 4s4-2 4-4M16 10a6 6 0 1 0 0-4 6 6 0 0 0 0 4z',
  dagger: 'M12 2L8 10l4 4 4-4zM12 14l-4 4h8zM10 18h4v2h-4z',
  bowArrow: 'M4 2c4 8 4 12 0 20M4 12h10l6 2-6 2h-10M14 10l4-4M14 14l4 4',
  horseshoe: 'M6 4c0 8 2 16 6 16s6-8 6-16M4 4h4v4M16 4h4v4',
  footprint: 'M8 4c-2 0-4 2-4 5s2 5 4 5 4-2 4-5-2-5-4-5zM14 10c-2 0-3 2-3 4s1 3 3 3 3-1 3-3-1-4-3-4z',
  footprint2: 'M16 4c2 0 4 2 4 5s-2 5-4 5-4-2-4-5 2-5 4-5zM10 10c2 0 3 2 3 4s-1 3-3 3-3-1-3-3 1-4 3-4z',
  coinStack: 'M4 8h16v2H4zM4 12h16v2H4zM4 16h16v2H4zM6 6h12v2H6z',
  scales2: 'M12 3v18M6 21h12M5 8l-3 8h6zM19 8l-3 8h6zM5 8c0 2 1 4 3 4s0-4 0-4M19 8c0 2 1 4 3 4s0-4 0-4',
}

 export default function Icon({ name, size, color, className, style, house }) {
   const path = ICON_PATHS[name]
   if (!path) return null

   const strokeColor = color || (house ? `var(--${house})` : 'currentColor')
   const svgStyle = {
     width: size || 24,
     height: size || 24,
     ...style,
   }

   return (
     <svg
       viewBox="0 0 24 24"
       fill="none"
       stroke={strokeColor}
       strokeWidth="1.5"
       strokeLinecap="round"
       strokeLinejoin="round"
       style={svgStyle}
       className={className}
     >
       <path d={path} />
     </svg>
   )
 }
