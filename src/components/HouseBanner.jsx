export default function HouseBanner({ name, words, primaryColor = 'grey', secondaryColor = 'black' }) {
  const colorMap = {
    white: '#f0f0f0', grey: '#4a4a5a', red: '#8b1538', gold: '#c5a059',
    black: '#1a1a1a', blue: '#1a3a5c', green: '#2d5a27', orange: '#b5651d',
    purple: '#4a235a', silver: '#b0b0b8', brown: '#5a3a1a', yellow: '#b5a01d',
    skyblue: '#5a8ab5', pink: '#b5658a', iron: '#4a4a4a'
  }

  const bg = colorMap[primaryColor] || colorMap.grey
  const text = colorMap[secondaryColor] || colorMap.black

  return (
    <div className="house-banner" style={{ backgroundColor: bg, color: text }}>
      <div>
        <div className="house-banner-name">{name}</div>
        {words && <div className="house-banner-words">"{words}"</div>}
      </div>
    </div>
  )
}
