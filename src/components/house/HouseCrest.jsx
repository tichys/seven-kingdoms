import { useMemo } from 'react'

// =====================================================
// HouseCrest — SVG-based house emblem renderer
// =====================================================
// Shapes: shield, banner, seal, roundel, bare
// Symbols: wolf, lion, dragon, raven, rose, sun, trout,
//          kraken, stag, bear, falcon, flayed, viper, onion
// =====================================================

const SYMBOL_PATHS = {
  wolf: 'M32 20 L40 8 L44 16 L52 12 L48 22 L56 28 L44 32 L40 44 L36 36 L28 44 L24 32 L16 28 L24 22 L20 12 L28 16 Z',
  lion: 'M30 12 C24 8 18 12 18 20 C14 18 12 24 16 28 C12 30 14 38 20 38 C22 44 28 46 32 42 C36 46 42 44 44 38 C50 38 52 30 48 28 C52 24 50 18 46 20 C46 12 40 8 34 12 Z',
  dragon: 'M30 10 L36 6 L34 14 L42 10 L40 18 L48 16 L44 24 L52 28 L44 32 L48 40 L40 38 L38 46 L32 40 L28 48 L26 38 L20 42 L22 34 L14 32 L20 26 L16 18 L24 20 L22 12 L28 16 Z',
  raven: 'M20 16 L16 10 L24 14 L28 8 L32 14 L40 10 L36 18 L44 20 L38 26 L42 32 L34 30 L32 38 L28 32 L24 38 L22 30 L16 32 L18 24 L12 22 Z',
  rose: 'M32 8 C28 8 24 12 24 16 C20 16 16 20 16 24 C12 24 10 28 12 32 C10 36 14 40 18 38 C20 42 26 42 28 38 C32 42 38 40 38 34 C42 34 44 30 42 26 C44 22 40 18 36 18 C36 14 36 8 32 8 Z',
  sun: 'M32 18 A14 14 0 1 0 32 46 A14 14 0 1 0 32 18 M32 6 L32 12 M32 52 L32 58 M6 32 L12 32 M52 32 L58 32 M14 14 L18 18 M46 46 L50 50 M14 50 L18 46 M46 18 L50 14',
  trout: 'M8 32 L16 24 L24 28 L32 20 L40 28 L48 24 L52 32 L48 40 L40 36 L32 44 L24 36 L16 40 Z',
  kraken: 'M32 10 L32 24 M32 24 L20 20 M32 24 L44 20 M32 24 L18 30 M32 24 L46 30 M32 24 L22 38 M32 24 L42 38 M32 24 L28 46 M32 24 L36 46 M32 24 L32 50',
  stag: 'M20 12 L16 6 L24 10 L28 4 L32 10 L40 6 L36 12 L44 16 L36 20 L40 28 L32 24 L28 30 L24 24 L16 28 L20 20 L12 16 Z',
  bear: 'M20 14 C18 10 14 12 14 18 L18 22 L14 28 L20 32 L18 38 L24 36 L28 42 L32 40 L36 42 L40 36 L46 38 L44 32 L50 28 L46 22 L50 18 C50 12 46 10 44 14 L40 18 L36 14 L32 18 L28 14 L24 18 Z',
  falcon: 'M16 8 L24 16 L28 12 L32 16 L36 12 L40 16 L48 8 L44 20 L50 24 L42 28 L46 36 L38 32 L32 40 L26 32 L18 36 L22 28 L14 24 L20 20 Z',
  flayed: 'M32 6 L28 14 L24 10 L22 20 L18 16 L18 28 L14 24 L16 36 L14 34 L18 42 L24 38 L28 46 L32 42 L36 46 L40 38 L46 42 L50 34 L48 36 L50 24 L46 28 L46 16 L42 20 L40 10 L36 14 Z',
  viper: 'M12 32 C16 20 24 16 32 20 C40 24 44 16 48 8 L52 12 C48 24 44 32 36 28 C28 24 20 28 16 40 L12 36 Z',
  onion: 'M32 6 C22 6 14 16 14 32 C14 44 22 54 32 54 C42 54 50 44 50 32 C50 16 42 6 32 6 Z M20 18 L28 14 L36 14 L44 18 L40 26 L32 22 L24 26 Z',
}

export default function HouseCrest({ crest, size = 80, showMotto = false }) {
  const symbolPath = useMemo(() => {
    return SYMBOL_PATHS[crest?.emblem_symbol] || SYMBOL_PATHS.wolf
  }, [crest])

  const shape = crest?.emblem_shape || 'shield'
  const primary = crest?.primary_color || '#2A3D1F'
  const secondary = crest?.secondary_color || '#8C6420'
  const accent = crest?.accent_color || '#ECEBE3'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block' }}>
        {/* Shape backgrounds */}
        {shape === 'shield' && (
          <>
            <path d="M32 4 L56 12 L56 32 C56 48 44 56 32 60 C20 56 8 48 8 32 L8 12 Z" fill={primary} stroke={secondary} strokeWidth="2" />
            <path d="M32 8 L52 14 L52 32 C52 44 42 52 32 56 C22 52 12 44 12 32 L12 14 Z" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.4" />
          </>
        )}
        {shape === 'banner' && (
          <>
            <rect x="8" y="8" width="48" height="48" fill={primary} stroke={secondary} strokeWidth="2" />
            <path d="M8 8 L8 16 L56 16 L56 8" fill={secondary} />
          </>
        )}
        {shape === 'seal' && (
          <>
            <circle cx="32" cy="32" r="28" fill={primary} stroke={secondary} strokeWidth="2" />
            <circle cx="32" cy="32" r="24" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.4" />
          </>
        )}
        {shape === 'roundel' && (
          <circle cx="32" cy="32" r="28" fill={primary} stroke={secondary} strokeWidth="2" />
        )}
        {shape === 'bare' && null}

        {/* Symbol */}
        <path d={symbolPath} fill={accent} stroke={secondary} strokeWidth="0.5" transform="translate(0, 4)" />

        {/* Shape-specific borders for bare */}
        {shape === 'bare' && (
          <path d={symbolPath} fill={primary} stroke={secondary} strokeWidth="0.5" transform="translate(0, 4)" />
        )}
      </svg>
      {showMotto && crest?.motto && (
        <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '200px' }}>
          {crest.motto}
        </span>
      )}
    </div>
  )
}
