export default function ItemCard({ item, equipped = false }) {
  const rarityColors = {
    common: '#c8ccd4',
    uncommon: '#4a8a4a',
    rare: '#4a6a9a',
    legendary: '#9a6a4a',
    unique: '#9a4a6a'
  }

  return (
    <div className={`item-card ${equipped ? 'item-card-equipped' : ''}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="item-name">{item.name}</div>
          <div className="item-type">
            {item.type || item.item_type}{item.subtype ? ` - ${item.subtype}` : ''}{equipped ? ' (Equipped)' : ''}
          </div>
        </div>
        <div className="text-end">
          {item.quantity > 1 && <span className="text-muted">x{item.quantity}</span>}
          {item.rarity && (
            <div style={{ color: rarityColors[item.rarity] || '#c8ccd4', fontSize: '0.75rem' }}>
              {item.rarity}
            </div>
          )}
        </div>
      </div>
      {(item.damage_mod != null && item.damage_mod !== 0) || (item.damage != null && item.damage !== 0) ? (
        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
          Damage: {(item.damage_mod ?? item.damage) >= 0 ? '+' : ''}{item.damage_mod ?? item.damage}
        </div>
      ) : null}
      {(item.damage_reduction != null && item.damage_reduction > 0) || (item.armor_dr != null && item.armor_dr > 0) ? (
        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
          Armor: {item.damage_reduction ?? item.armor_dr}
        </div>
      ) : null}
    </div>
  )
}
