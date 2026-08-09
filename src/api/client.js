const API_BASE = import.meta.env.VITE_API_BASE || '/api/web'

function getToken() {
  return localStorage.getItem('asoiaf_token')
}

function setToken(token) {
  if (token) {
    localStorage.setItem('asoiaf_token', token)
  } else {
    localStorage.removeItem('asoiaf_token')
  }
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const config = {
    ...options,
    headers
  }

  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, config)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error('Cannot connect to server. Is the backend running?')
    }
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'SyntaxError') {
      throw new Error('Cannot connect to server. Is the backend running?')
    }
    throw err
  }
}

export const api = {
  // Auth
  login: (avatarKey, loginCode) =>
    request('web_login.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', avatar_key: avatarKey, login_code: loginCode })
    }),

  logout: () =>
    request('web_login.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' })
    }),

  validateSession: () =>
    request('web_login.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'validate' })
    }),

  // Character
  getCharacter: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'get' })
    }),

  getStats: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'stats' })
    }),

  getInventory: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'inventory' })
    }),

  getSkills: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'skills' })
    }),

  getWounds: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'wounds' })
    }),

  // Houses
  getHouses: (filter = null, region = null) =>
    request('web_houses.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'list', filter, region })
    }),

  getHouse: (houseId) =>
    request('web_houses.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'get', house_id: houseId })
    }),

  getHouseMembers: (houseId) =>
    request('web_houses.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'members', house_id: houseId })
    }),

  // Logs
  getCombatLog: (limit = 20, offset = 0) =>
    request('web_logs.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'combat', limit, offset })
    }),

  getEconomyLog: (limit = 20, offset = 0) =>
    request('web_logs.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'economy', limit, offset })
    }),

  getRavenInbox: (limit = 20, offset = 0) =>
    request('web_logs.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'ravens', limit, offset })
    }),

  getQuestLog: (limit = 20, offset = 0) =>
    request('web_logs.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'quests', limit, offset })
    }),

  // Admin
  getOnlinePlayers: () =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'online' })
    }),

  adminGrant: (targetKey, grantType, value, currency = null) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'grant', target_key: targetKey, grant_type: grantType, value, currency })
    }),

  adminHeal: (targetKey, woundId = null) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'heal', target_key: targetKey, wound_id: woundId })
    }),

  adminAudit: (logType, target = null, limit = 50) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'audit', log_type: logType, target_key: target, limit })
    }),
  adminBroadcast: (message) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'broadcast', message })
    }),
  adminPlayerSearch: (search) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'player_search', search })
    }),
  adminPlayerDetail: (targetKey) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'player_detail', target_key: targetKey })
    }),
  adminPlayerBan: (targetKey, banned, banUntil = null) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'player_ban', target_key: targetKey, banned, ban_until: banUntil })
    }),
  adminSetAdmin: (targetKey, level) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'player_set_admin', target_key: targetKey, level })
    }),
  adminHouseMembers: (houseId) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'house_members', house_id: houseId })
    }),
  adminSetLord: (houseId, targetKey) =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'house_set_lord', house_id: houseId, target_key: targetKey })
    }),
  adminEconomyStats: () =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'economy_stats' })
    }),
  adminServerStats: () =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'server_stats' })
    }),
  adminPendingRequests: () =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'pending_requests' })
    }),
  adminApproveRequest: (requestId, note = '') =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve_request', request_id: requestId, note })
    }),
  adminDenyRequest: (requestId, note = '') =>
    request('web_admin.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'deny_request', request_id: requestId, note })
    }),

  // Wiki
  getWikiPage: (pageName) =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'get', page: pageName })
    }),

  getItems: (search = null, type = null) =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'items', search, type })
    }),

  getServerStatus: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'server_status' })
    }),

  // Account/Profile
  getProfile: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'profile' })
    }),
  updateProfile: (icStatus) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_profile', ic_status: icStatus })
    }),
  getTitles: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'titles' })
    }),
  setTitle: (titleId) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'set_title', title_id: titleId })
    }),
  getRavens: (folder = 'inbox', limit = 20, offset = 0) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'ravens', folder, limit, offset })
    }),
  readRaven: (ravenId) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'read_raven', raven_id: ravenId })
    }),
  deleteRaven: (ravenId) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete_raven', raven_id: ravenId })
    }),
  allocateStat: (statName, points) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'allocate_stat', stat_name: statName, points })
    }),
  resetStats: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_stats' })
    }),
  getAvailableArchetypes: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'available_archetypes' })
    }),
  joinHouse: (houseId, rank = 'Smallfolk') =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'join_house', house_id: houseId, rank })
    }),
  leaveHouse: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'leave_house' })
    }),
  housesList: (search = null, region = null) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'houses_list', search, region })
    }),
  chooseArchetype: (archetypeId) =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'choose_archetype', archetype_id: archetypeId })
    }),
  myRequests: () =>
    request('web_character.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'my_requests' })
    }),
  getToken,
  setToken,
  // Database
  getFactions: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'factions' })
    }),
  getArchetypes: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'archetypes' })
    }),
  getReligions: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'religions' })
    }),
  wikiDiseases: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'diseases' })
    }),
  getQuests: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'quests' })
    }),
  getRecipes: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'recipes' })
    }),
  getStations: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'stations' })
    }),
  getTerritories: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'territories' })
    }),
  getMagicTypes: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'magic_types' })
    }),
  getEnvironment: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'environment' })
    }),
  getShops: () =>
    request('web_wiki.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'shops' })
    }),

  // War System - Settlements
  settlementList: (houseId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'settlement_list', house_id: houseId })
    }),
  settlementGet: (territoryId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'settlement_get', territory_id: territoryId })
    }),
  settlementCollect: (territoryId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'settlement_collect', territory_id: territoryId })
    }),
  settlementBuild: (territoryId, upgradeType) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'settlement_build', territory_id: territoryId, upgrade_type: upgradeType })
    }),
  settlementResources: (houseId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'settlement_resources', house_id: houseId })
    }),

  // War System - Armies
  armyList: (houseId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_list', house_id: houseId })
    }),
  armyGet: (armyId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_get', army_id: armyId })
    }),
  armyCreate: (houseId, armyName, territoryId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_create', house_id: houseId, army_name: armyName, territory_id: territoryId })
    }),
  armyRecruit: (armyId, unitType, count) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_recruit', army_id: armyId, unit_type: unitType, count })
    }),
  armyMove: (armyId, targetTerritoryId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_move', army_id: armyId, target_territory_id: targetTerritoryId })
    }),
  armyAttackArmy: (armyId, targetArmyId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_attack_army', army_id: armyId, target_army_id: targetArmyId })
    }),
  armyAttackSettlement: (armyId, targetTerritoryId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_attack_settlement', army_id: armyId, target_territory_id: targetTerritoryId })
    }),
  armyAttackNpc: (armyId, encounterId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_attack_npc', army_id: armyId, encounter_id: encounterId })
    }),
  armyDisband: (armyId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'army_disband', army_id: armyId })
    }),

  // War System - Wars
  warList: (houseId = null) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'war_list', house_id: houseId })
    }),
  warDeclare: (house1Id, house2Id, reason) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'war_declare', house1_id: house1Id, house2_id: house2Id, reason })
    }),
  warAccept: (warId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'war_accept', war_id: warId })
    }),
  warEnd: (warId, winnerHouseId = null) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'war_end', war_id: warId, winner_house_id: winnerHouseId })
    }),
  warBattles: (houseId = null, limit = 20) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'war_battles', house_id: houseId, limit })
    }),

  // War System - Encounters
  encounterList: (region = null) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'encounter_list', region })
    }),
  encounterHunt: (region) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'encounter_hunt', region })
    }),
  encounterEngage: (encounterId, armyId = null) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'encounter_engage', encounter_id: encounterId, army_id: armyId })
    }),
  encounterDetails: (encounterId) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'encounter_details', encounter_id: encounterId })
    }),
  encounterSpawn: (creatureTypeId, region, count, encounterType) =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'encounter_spawn', creature_type_id: creatureTypeId, region, count, encounter_type: encounterType })
    }),
  creatureList: () =>
    request('web_war.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'creature_list' })
    }),

  // PvE - Dungeons
  dungeonList: (region = null) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_list', region })
    }),
  dungeonDetails: (dungeonId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_details', dungeon_id: dungeonId })
    }),
  dungeonEnter: (dungeonId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_enter', dungeon_id: dungeonId })
    }),
  dungeonAdvance: (runId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_advance', run_id: runId })
    }),
  dungeonRetreat: (runId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_retreat', run_id: runId })
    }),
  dungeonStatus: (runId = null) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_status', run_id: runId })
    }),
  dungeonLoot: (runId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'dungeon_loot', run_id: runId })
    }),

  // PvE - Bounties
  bountyList: (region = null) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bounty_list', region })
    }),
  bountyAccept: (bountyId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bounty_accept', bounty_id: bountyId })
    }),
  bountyCheck: (bountyId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bounty_check', bounty_id: bountyId })
    }),
  bountyComplete: (bountyId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bounty_complete', bounty_id: bountyId })
    }),
  bountyProgress: () =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bounty_progress' })
    }),
  bountyMy: () =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bounty_my' })
    }),

  // PvE - Bestiary
  bestiary: () =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'bestiary' })
    }),
  creatureLoot: (creatureTypeId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'creature_loot', creature_type_id: creatureTypeId })
    }),
  bossPhases: (creatureTypeId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'boss_phases', creature_type_id: creatureTypeId })
    }),

  // PvE - NPC
  npcList: (region = null) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'npc_list', region })
    }),
  npcTalk: (npcName) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'npc_talk', npc_name: npcName })
    }),
  npcRespond: (npcName, dialogueKey) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'npc_respond', npc_name: npcName, dialogue_key: dialogueKey })
    }),
  npcVendor: (itemType = null) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'npc_vendor', item_type: itemType })
    }),
  npcBuy: (itemId) =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'npc_buy', item_id: itemId })
    }),

  // PvE - Admin
  encounterAutoSpawn: () =>
    request('web_pve.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'encounter_auto_spawn' })
    }),

  // Community - Leaderboards
  leaderboardRP: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'leaderboard_rp' }) }),
  leaderboardCombat: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'leaderboard_combat' }) }),
  leaderboardWealth: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'leaderboard_wealth' }) }),
  leaderboardHouses: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'leaderboard_houses' }) }),

  // Community - Achievements
  achievementList: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'achievement_list' }) }),
  myAchievements: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'my_achievements' }) }),
  checkAchievements: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'check_achievements' }) }),

  // Community - Trading
  tradeCreate: (toKey, fromItems, toItems, fromGold, toGold) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_create', to_key: toKey, from_items: fromItems, to_items: toItems, from_gold: fromGold, to_gold: toGold }) }),
  tradeList: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_list' }) }),
  communityTradeAccept: (tradeId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_accept', trade_id: tradeId }) }),
  communityTradeReject: (tradeId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_reject', trade_id: tradeId }) }),
  communityTradeCancel: (tradeId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_cancel', trade_id: tradeId }) }),

  // Community - Marketplace
  marketList: (category = null, search = null) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'market_list', category, search }) }),
  marketMyListings: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'market_my_listings' }) }),
  marketCreate: (itemId, quantity, pricePerUnit, listingType = 'sale') => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'market_create', item_id: itemId, quantity, price_per_unit: pricePerUnit, listing_type: listingType }) }),
  marketBuy: (listingId, quantity = 1) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'market_buy', listing_id: listingId, quantity }) }),
  marketCancel: (listingId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'market_cancel', listing_id: listingId }) }),

  // Community - Tournaments
  tournamentList: (status = null) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_list', status }) }),
  tournamentDetails: (tournamentId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_details', tournament_id: tournamentId }) }),
  tournamentRegister: (tournamentId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_register', tournament_id: tournamentId }) }),
  tournamentMy: () => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_my' }) }),
  tournamentAdminCreate: (name, type, maxParticipants, prizeGold, prizeXp, region, description) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_admin_create', name, tournament_type: type, max_participants: maxParticipants, prize_gold: prizeGold, prize_xp: prizeXp, region, description }) }),
  tournamentAdminAdvance: (tournamentId, winnerKey, loserKey, round) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_admin_advance', tournament_id: tournamentId, winner_key: winnerKey, loser_key: loserKey, round }) }),

  // World - Events
  eventList: () => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'event_list' }) }),
  eventActive: () => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'event_active' }) }),
  eventCreate: (name, type, region, severity, description, endDate) => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'event_create', name, event_type: type, region, severity, description, end_date: endDate }) }),
  eventEnd: (eventId) => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'event_end', event_id: eventId }) }),

  // World - Housing
  plotList: (territoryId = null) => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'house_plot_list', territory_id: territoryId }) }),
  plotClaim: (territoryId, houseName) => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'house_plot_claim', territory_id: territoryId, house_name: houseName }) }),
  plotMy: () => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'house_plot_my' }) }),
  plotAbandon: (plotId) => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'house_plot_abandon', plot_id: plotId }) }),

  // World - Feast Buffs
  feastMy: () => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'feast_my' }) }),
  feastGrant: (avatarKey, buffType, statBonus, bonusValue, hpBonus, xpBonus, durationMinutes) => request('web_world.php', { method: 'POST', body: JSON.stringify({ action: 'feast_grant', avatar_key: avatarKey, buff_type: buffType, stat_bonus: statBonus, bonus_value: bonusValue, hp_bonus: hpBonus, xp_bonus_pct: xpBonus, duration_minutes: durationMinutes }) }),

  // Admin - Creatures
  adminCreatureList: (search = '') => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'creature_list', search }) }),
  creatureCreate: (data) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'creature_create', ...data }) }),
  creatureUpdate: (id, data) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'creature_update', creature_id: id, ...data }) }),
  creatureDelete: (id) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'creature_delete', creature_id: id }) }),

  // Admin - Advanced
  spawnCreature: (creatureTypeId, region, count) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'spawn_creature', creature_type_id: creatureTypeId, region, count }) }),
  grantTitle: (avatarKey, titleId) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'grant_title', avatar_key: avatarKey, title_id: titleId }) }),
  setWeather: (region, weatherType, severity, duration) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'set_weather', region, weather_type: weatherType, severity, duration_minutes: duration }) }),
  forceQuestComplete: (avatarKey, questId) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'force_quest_complete', avatar_key: avatarKey, quest_id: questId }) }),
  infectPlayer: (avatarKey, diseaseId) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'infect_player', avatar_key: avatarKey, disease_id: diseaseId }) }),
  setSeason: (season, intensity) => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'set_season', season, intensity }) }),

  // Recent events (notice board)
  recentEvents: () => request('web_wiki.php', { method: 'POST', body: JSON.stringify({ action: 'recent_events' }) }),

  // Survival & Diseases
  getSurvival: () => request('web_character.php', { method: 'POST', body: JSON.stringify({ action: 'survival' }) }),
  getDiseases: () => request('web_character.php', { method: 'POST', body: JSON.stringify({ action: 'diseases' }) }),

  // Quests
  questList: () => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'list' }) }),
  questActive: () => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'active' }) }),
  questAccept: (questId) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'accept', quest_id: questId }) }),
  questComplete: (questId) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'complete', quest_id: questId }) }),
  questAbandon: (questId) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'abandon', quest_id: questId }) }),

  // Quest Graph Editor (admin)
  questGraphList: () => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'list_admin' }) }),
  questGraphGet: (questId) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'get_graph', quest_id: questId }) }),
  questGraphAddNode: (questId, x, y, nodeType, triggerType) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'add_node', quest_id: questId, x, y, node_type: nodeType, trigger_type: triggerType }) }),
  questGraphUpdateNode: (questId, nodeKey, data) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'update_node', quest_id: questId, node_key: nodeKey, ...data }) }),
  questGraphDeleteNode: (questId, nodeKey) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'delete_node', quest_id: questId, node_key: nodeKey }) }),
  questGraphAddEdge: (questId, fromKey, toKey) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'add_edge', quest_id: questId, from_node_key: fromKey, to_node_key: toKey }) }),
  questGraphDeleteEdge: (edgeId) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'delete_edge', edge_id: edgeId }) }),
  questGraphSaveGate: (questId, nodeKey, combinator, conditions) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'save_gate', quest_id: questId, node_key: nodeKey, combinator, conditions }) }),
  questGraphSaveRewards: (questId, nodeKey, rewards) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'save_rewards', quest_id: questId, node_key: nodeKey, rewards }) }),
  questGraphGenerateLsl: (questId) => request('web_quest.php', { method: 'POST', body: JSON.stringify({ action: 'generate_lsl', quest_id: questId }) }),

  // Props/Document Renderer
  propListTemplates: (type) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'list_templates', type }) }),
  propGetTemplate: (templateId) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'get_template', template_id: templateId }) }),
  propSaveTemplate: (templateId, name, description, templateType, width, height, bgColor, layers, variables) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'save_template', template_id: templateId, name, description, template_type: templateType, width, height, background_color: bgColor, layers, variables }) }),
  propDeleteTemplate: (templateId) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'delete_template', template_id: templateId }) }),
  propListInstances: (templateId) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'list_instances', template_id: templateId }) }),
  propCreateInstance: (templateId, name, variableData) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'create_instance', template_id: templateId, name, variable_data: variableData }) }),
  propGetInstance: (instanceId) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'get_instance', instance_id: instanceId }) }),
  propSaveRender: (instanceId, renderBase64) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'save_render', instance_id: instanceId, render_base64: renderBase64 }) }),
  propUploadToSl: (instanceId) => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'upload_to_sl', instance_id: instanceId }) }),
  propListFonts: () => request('web_props.php', { method: 'POST', body: JSON.stringify({ action: 'list_fonts' }) }),

  // House Crests & Uniforms + Roster
  crestGet: (houseId) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'get_crest', house_id: houseId }) }),
  crestSave: (houseId, crest) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'save_crest', house_id: houseId, ...crest }) }),
  uniformGet: (houseId) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'get_uniform', house_id: houseId }) }),
  uniformSave: (houseId, description, colors, items) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'save_uniform', house_id: houseId, description, colors, items }) }),
  groupLinkGet: (houseId) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'get_group_link', house_id: houseId }) }),
  groupLinkSave: (houseId, groupUuid, groupName) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'save_group_link', house_id: houseId, group_uuid: groupUuid, group_name: groupName }) }),
  rosterGet: (houseId) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'get_roster', house_id: houseId }) }),
  rosterSync: (houseId) => request('web_crests.php', { method: 'POST', body: JSON.stringify({ action: 'sync_roster', house_id: houseId }) }),

  // Events Calendar
  eventList: (month, year, type) => request('web_events.php', { method: 'POST', body: JSON.stringify({ action: 'list', month, year, type }) }),
  eventGet: (eventId) => request('web_events.php', { method: 'POST', body: JSON.stringify({ action: 'get', event_id: eventId }) }),
  eventCreate: (data) => request('web_events.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...data }) }),
  eventUpdate: (eventId, data) => request('web_events.php', { method: 'POST', body: JSON.stringify({ action: 'update', event_id: eventId, ...data }) }),
  eventCancel: (eventId) => request('web_events.php', { method: 'POST', body: JSON.stringify({ action: 'cancel', event_id: eventId }) }),
  eventNotify: (eventId) => request('web_events.php', { method: 'POST', body: JSON.stringify({ action: 'notify', event_id: eventId }) }),

  // Housing/Rentals
  housingListPlots: (territoryId) => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'list_plots', territory_id: territoryId }) }),
  housingMyPlots: () => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'my_plots' }) }),
  housingPayRent: (plotId, periodDays) => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'pay_rent', plot_id: plotId, period_days: periodDays }) }),
  housingAssignPlot: (plotId, avatarKey) => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'assign_plot', plot_id: plotId, avatar_key: avatarKey }) }),
  housingReleasePlot: (plotId) => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'release_plot', plot_id: plotId }) }),
  housingCreatePlot: (data) => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'create_plot', ...data }) }),
  housingListTerritories: () => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'list_territories' }) }),
  housingPaymentHistory: (plotId) => request('web_housing.php', { method: 'POST', body: JSON.stringify({ action: 'payment_history', plot_id: plotId }) }),

  // Castle Ledger (Incident/Moderation)
  ledgerList: (status, category) => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'list', status, category }) }),
  ledgerMyIncidents: () => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'my_incidents' }) }),
  ledgerGet: (incidentId) => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'get', incident_id: incidentId }) }),
  ledgerFile: (data) => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'file', ...data }) }),
  ledgerAddNote: (incidentId, note, isInternal) => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'add_note', incident_id: incidentId, note, is_internal: isInternal }) }),
  ledgerAddEvidence: (incidentId, url) => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'add_evidence', incident_id: incidentId, url }) }),
  ledgerUpdateStatus: (incidentId, status) => request('web_ledger.php', { method: 'POST', body: JSON.stringify({ action: 'update_status', incident_id: incidentId, status }) }),

  // Crafting
  craftRecipes: (stationType) => request('web_crafting.php', { method: 'POST', body: JSON.stringify({ action: 'recipes', station_type: stationType }) }),
  craftStations: () => request('web_crafting.php', { method: 'POST', body: JSON.stringify({ action: 'stations' }) }),
  craftStart: (recipeId, stationId) => request('web_crafting.php', { method: 'POST', body: JSON.stringify({ action: 'start', recipe_id: recipeId, station_id: stationId }) }),
  craftCheck: () => request('web_crafting.php', { method: 'POST', body: JSON.stringify({ action: 'check' }) }),
  craftComplete: (craftId) => request('web_crafting.php', { method: 'POST', body: JSON.stringify({ action: 'complete', craft_id: craftId }) }),
  craftCancel: (craftId) => request('web_crafting.php', { method: 'POST', body: JSON.stringify({ action: 'cancel', craft_id: craftId }) }),

  // House Management
  myHouse: () => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'my_house' }) }),
  houseDetail: (houseId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'detail', house_id: houseId }) }),
  houseMembers: (houseId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'members', house_id: houseId }) }),
  houseFound: (data) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'found', ...data }) }),
  housePromote: (targetKey, rank) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'promote', target_key: targetKey, rank }) }),
  houseAlliances: (houseId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'alliances', house_id: houseId }) }),
  houseAlliancePropose: (house1Id, house2Id) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'alliance_propose', house1_id: house1Id, house2_id: house2Id }) }),
  houseAllianceAccept: (allianceId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'alliance_accept', alliance_id: allianceId }) }),
  houseAllianceBreak: (allianceId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'alliance_break', alliance_id: allianceId }) }),
  houseMarriages: (houseId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'marriages', house_id: houseId }) }),
  houseProposeMarriage: (targetKey) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'propose_marriage', target_key: targetKey }) }),
  houseMarry: (marriageId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'marry', marriage_id: marriageId }) }),
  houseAnnul: (marriageId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'annul', marriage_id: marriageId }) }),
  houseSwear: (minorId, majorId) => request('web_house.php', { method: 'POST', body: JSON.stringify({ action: 'swear', minor_id: minorId, major_id: majorId }) }),

  // Factions
  factionList: () => request('web_faction.php', { method: 'POST', body: JSON.stringify({ action: 'list' }) }),
  factionMyRep: () => request('web_faction.php', { method: 'POST', body: JSON.stringify({ action: 'my_rep' }) }),
  factionJoin: (factionId) => request('web_faction.php', { method: 'POST', body: JSON.stringify({ action: 'join', faction_id: factionId }) }),
  factionRewards: () => request('web_faction.php', { method: 'POST', body: JSON.stringify({ action: 'rewards' }) }),
  factionClaim: (rewardId) => request('web_faction.php', { method: 'POST', body: JSON.stringify({ action: 'claim', reward_id: rewardId }) }),

  // Religion
  religionGet: () => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'get' }) }),
  religionList: () => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'list' }) }),
  religionSet: (religionId) => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'set', religion_id: religionId }) }),
  religionPray: () => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'pray' }) }),
  religionSacrifice: (type) => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'sacrifice', type }) }),
  religionPowers: () => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'powers' }) }),
  religionUsePower: (power) => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'use_piety', power }) }),

  // Character Creator
  creatorOptions: () => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'options' }) }),
  creatorSubmit: (data) => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'submit', ...data }) }),
  creatorStatus: () => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'status' }) }),
  creatorResubmit: (data) => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'resubmit', ...data }) }),

  // Admin - Character Applications
  adminApplicationList: (status = 'pending') => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'list', status }) }),
  adminApplicationDetail: (appId) => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'detail', application_id: appId }) }),
  adminApplicationApprove: (appId, note = '') => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'approve', application_id: appId, note }) }),
  adminApplicationDeny: (appId, note) => request('web_character_creator.php', { method: 'POST', body: JSON.stringify({ action: 'deny', application_id: appId, note }) }),

  // Trade System
  tradeMyGoods: () => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'my_goods' }) }),
  tradeAllGoods: () => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'all_goods' }) }),
  tradePropose: (data) => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'propose', ...data }) }),
  tradeMyTrades: () => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'my_trades' }) }),
  tradeAccept: (tradeId) => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'accept', trade_id: tradeId }) }),
  tradeReject: (tradeId) => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'reject', trade_id: tradeId }) }),
  tradeCancel: (tradeId) => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'cancel', trade_id: tradeId }) }),
  tradeMarket: () => request('web_trade.php', { method: 'POST', body: JSON.stringify({ action: 'market' }) }),

  // RP Systems - Mounts
  mountList: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'mount_list' }) }),
  mountMy: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'mount_my' }) }),
  mountBuy: (data) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'mount_buy', ...data }) }),
  mountEquip: (mountId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'mount_equip', mount_id: mountId }) }),
  mountTrain: (mountId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'mount_train', mount_id: mountId }) }),

  // RP Systems - Training
  trainers: (region) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'trainers', region }) }),
  myTrainers: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'my_trainers' }) }),
  trainSkill: (trainerId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'train', trainer_id: trainerId }) }),

  // RP Systems - Exploration
  landmarks: (region) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'landmarks', region }) }),
  discover: (landmarkId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'discover', landmark_id: landmarkId }) }),
  myDiscoveries: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'my_discoveries' }) }),
  explorationStats: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'exploration_stats' }) }),

  // RP Systems - Contracts
  contractList: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'contract_list' }) }),
  contractMy: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'contract_my' }) }),
  contractCreate: (data) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'contract_create', ...data }) }),
  contractAccept: (id) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'contract_accept', contract_id: id }) }),
  contractComplete: (id) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'contract_complete', contract_id: id }) }),
  contractCancel: (id) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'contract_cancel', contract_id: id }) }),

  // RP Systems - Taverns
  tavernList: (region) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'tavern_list', region }) }),
  tavernRest: (tavernId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'tavern_rest', tavern_id: tavernId }) }),
  tavernMeal: (tavernId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'tavern_meal', tavern_id: tavernId }) }),
  tavernDrink: (tavernId) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'tavern_drink', tavern_id: tavernId }) }),

  // RP Systems - Cyvasse
  cyvassePlay: (wager, opponent) => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'cyvasse_play', wager_gold: wager, opponent }) }),
  cyvasseStats: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'cyvasse_stats' }) }),
  cyvasseLeaderboard: () => request('web_rp.php', { method: 'POST', body: JSON.stringify({ action: 'cyvasse_leaderboard' }) }),

  // Object UI - Banking
  convertCurrency: (direction, amount) => request('web_character.php', { method: 'POST', body: JSON.stringify({ action: 'convert_currency', direction, amount }) }),

  // Object UI - Healing
  healShrine: (healAmount) => request('web_character.php', { method: 'POST', body: JSON.stringify({ action: 'heal_shrine', heal_amount: healAmount }) }),

  // Object UI - Arena
  arenaDuel: (targetKey) => request('web_pve.php', { method: 'POST', body: JSON.stringify({ action: 'arena_duel', target_key: targetKey }) }),

  // Object UI - Resurrection
  resurrectRequest: (deadName) => request('web_character.php', { method: 'POST', body: JSON.stringify({ action: 'resurrect_request', dead_name: deadName }) }),

  // Object UI - Shop (uses existing npc_vendor/npc_buy)
  // npcVendor and npcBuy already defined above

  // Object UI - Bounty (uses existing bounty endpoints)
  // bountyList, bountyAccept, bountyProgress, bountyMy already defined above

  // Object UI - Notice (uses existing recentEvents)
  // recentEvents already defined above

  // Object UI - Census (uses existing getServerStatus)
  // getServerStatus already defined above

  // Object UI - Crafting (uses existing craft endpoints)
  // craftRecipes, craftStart, craftCheck, craftComplete already defined above

  // Discord OAuth2
  discordAuthUrl: (mode = 'login') => request('web_discord.php', { method: 'POST', body: JSON.stringify({ action: 'auth_url', mode }) }),
  discordCallback: (code, state) => request('web_discord.php', { method: 'POST', body: JSON.stringify({ action: 'callback', code, state }) }),
  discordStatus: () => request('web_discord.php', { method: 'POST', body: JSON.stringify({ action: 'status' }) }),
  discordUnlink: () => request('web_discord.php', { method: 'POST', body: JSON.stringify({ action: 'unlink' }) }),

  // GoTBot (SL Bot Service)
  botStatus: () => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'status' }) }),
  botBalance: () => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'balance' }) }),
  botSendRaven: (avatarKey, message) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'send_raven', avatar_key: avatarKey, message }) }),
  botInviteHouse: (groupUuid, avatarKey, roleUuid = null) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'invite_house', group_uuid: groupUuid, avatar_key: avatarKey, role_uuid: roleUuid }) }),
  botEjectHouse: (groupUuid, avatarKey) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'eject_house', group_uuid: groupUuid, avatar_key: avatarKey }) }),
  botSyncRoster: (groupUuid) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'sync_roster', group_uuid: groupUuid }) }),
  botGetRoster: (groupUuid) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'get_roster', group_uuid: groupUuid }) }),
  botUploadTexture: (name, description, base64) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'upload_texture', name, description, texture_base64: base64 }) }),
  botDeliverItem: (avatarKey, itemUuid) => request('web_bot.php', { method: 'POST', body: JSON.stringify({ action: 'deliver_item', avatar_key: avatarKey, item_uuid: itemUuid }) }),

  // Raven Network (real-time channel messaging)
  ravenChannels: () => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'list_channels' }) }),
  ravenAllChannels: () => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'list_all_channels' }) }),
  ravenMessages: (channelId, sinceId) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'messages', channel_id: channelId, since_id: sinceId || 0 }) }),
  ravenSend: (channelId, body) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'send', channel_id: channelId, body }) }),
  ravenSubscribe: (channelId) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'subscribe', channel_id: channelId }) }),
  ravenUnsubscribe: (channelId) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'unsubscribe', channel_id: channelId }) }),
  ravenToggleMute: (channelId) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'toggle_mute', channel_id: channelId }) }),
  ravenCreateChannel: (data) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'create_channel', ...data }) }),
  ravenDeleteMessage: (messageId) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'delete_message', message_id: messageId }) }),
  ravenMembers: (channelId) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'members', channel_id: channelId }) }),
  ravenSetRole: (channelId, targetKey, role) => request('web_raven.php', { method: 'POST', body: JSON.stringify({ action: 'set_role', channel_id: channelId, target_key: targetKey, role }) }),

  // Maester System (Academic)
  maesterCourses: (semester, skill) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'courses', semester, skill }) }),
  maesterMyEnrollments: () => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'my_enrollments' }) }),
  maesterEnroll: (courseId) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'enroll', course_id: courseId }) }),
  maesterDrop: (enrollmentId) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'drop', enrollment_id: enrollmentId }) }),
  maesterGrade: (enrollmentId, grade, notes) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'grade', enrollment_id: enrollmentId, grade, notes }) }),
  maesterAllEnrollments: (courseId, status) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'all_enrollments', course_id: courseId, status }) }),
  maesterCertifications: () => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'certifications' }) }),
  maesterAwardCert: (certId, avatarKey) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'award_cert', cert_id: certId, avatar_key: avatarKey }) }),
  maesterCreateCourse: (data) => request('web_maester.php', { method: 'POST', body: JSON.stringify({ action: 'create_course', ...data }) }),

  // Citizen Directory
  directorySearch: (search, houseId, archetypeId, page) => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'search', search, house_id: houseId, archetype_id: archetypeId, page }) }),
  directoryDossier: (avatarKey) => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'dossier', avatar_key: avatarKey }) }),
  directoryUpdateProfile: (data) => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'update_profile', ...data }) }),
  directoryMyProfile: () => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'my_profile' }) }),
  directoryHouses: () => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'houses' }) }),
  directoryArchetypes: () => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'archetypes' }) }),
  directoryFeatured: () => request('web_directory.php', { method: 'POST', body: JSON.stringify({ action: 'featured' }) }),

  // Dynamic Forms
  formsList: (activeOnly, formType) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'list', active_only: activeOnly, form_type: formType }) }),
  formGet: (formId) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'get', form_id: formId }) }),
  formCreate: (data) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...data }) }),
  formUpdate: (formId, data) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'update', form_id: formId, ...data }) }),
  formDelete: (formId) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'delete', form_id: formId }) }),
  formSubmit: (formId, data) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'submit', form_id: formId, data }) }),
  formMySubmissions: () => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'my_submissions' }) }),
  formListSubmissions: (formId, status) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'list_submissions', form_id: formId, status }) }),
  formReview: (submissionId, status, notes) => request('web_forms.php', { method: 'POST', body: JSON.stringify({ action: 'review', submission_id: submissionId, status, notes }) }),

  // Health System
  healthGet: () => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'get' }) }),
  healthGetStanding: (avatarKey) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'get_standing', avatar_key: avatarKey }) }),
  healthSetStanding: (standing, notes) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'set_standing', standing, notes }) }),
  healthGetConsent: () => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'get_consent' }) }),
  healthSetConsent: (data) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'set_consent', ...data }) }),
  healthGetTreatments: (avatarKey) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'get_treatments', avatar_key: avatarKey }) }),
  healthAddTreatment: (patientKey, treatmentType, description, performCheck) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'add_treatment', patient_key: patientKey, treatment_type: treatmentType, description, perform_skill_check: performCheck }) }),
  healthGetCycle: () => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'get_cycle' }) }),
  healthSetCycle: (enabled, data) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'set_cycle', enabled, data }) }),
  healthGetPatient: (patientKey) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'get_patient', patient_key: patientKey }) }),
  healthQuarantine: (avatarKey, reason) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'quarantine', avatar_key: avatarKey, reason }) }),
  healthLiftQuarantine: (avatarKey) => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'lift_quarantine', avatar_key: avatarKey }) }),
  healthListQuarantines: () => request('web_health.php', { method: 'POST', body: JSON.stringify({ action: 'list_quarantines' }) }),

  // Settlement Expansion — 9 systems via web_settlement.php
  // Population & Morale
  settlementOverview: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'overview', territory_id: territoryId }) }),
  populationGet: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'population_get', territory_id: territoryId }) }),
  populationSetTax: (territoryId, taxRate) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'population_set_tax', territory_id: territoryId, tax_rate: taxRate }) }),
  populationTick: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'population_tick', territory_id: territoryId }) }),

  // Taxation
  taxList: (houseId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'tax_list', house_id: houseId }) }),
  taxSet: (overlordId, vassalId, taxRate, taxType) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'tax_set', overlord_house_id: overlordId, vassal_house_id: vassalId, tax_rate: taxRate, tax_type: taxType }) }),
  taxAccept: (taxId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'tax_accept', tax_id: taxId }) }),
  taxRefuse: (taxId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'tax_refuse', tax_id: taxId }) }),
  taxCollect: (overlordId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'tax_collect', overlord_house_id: overlordId }) }),
  taxHistory: (houseId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'tax_history', house_id: houseId }) }),

  // Specialization
  specializationGet: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'specialization_get', territory_id: territoryId }) }),
  specializationSet: (territoryId, spec) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'specialization_set', territory_id: territoryId, specialization: spec }) }),

  // Dynamic Events
  eventList: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'event_list', territory_id: territoryId }) }),
  eventResolve: (eventId, choiceKey) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'event_resolve', event_id: eventId, choice_key: choiceKey }) }),
  eventGenerate: (territoryId, eventType) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'event_generate', territory_id: territoryId, event_type: eventType || '' }) }),
  eventHistory: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'event_history', territory_id: territoryId }) }),

  // Trade Routes
  tradeList: (houseId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'trade_list', house_id: houseId }) }),
  tradeCreate: (data) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'trade_create', ...data }) }),
  tradeSuspend: (routeId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'trade_suspend', route_id: routeId }) }),
  tradeResume: (routeId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'trade_resume', route_id: routeId }) }),
  tradeDestroy: (routeId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'trade_destroy', route_id: routeId }) }),

  // Construction Queue
  constructionList: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'construction_list', territory_id: territoryId }) }),
  constructionQueue: (territoryId, upgradeType) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'construction_queue', territory_id: territoryId, upgrade_type: upgradeType }) }),

  // Settlement Roles
  rolesList: (territoryId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'roles_list', territory_id: territoryId }) }),
  roleAssign: (territoryId, avatarKey, role) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'role_assign', territory_id: territoryId, avatar_key: avatarKey, role }) }),
  roleRevoke: (roleId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'role_revoke', role_id: roleId }) }),

  // Seasons
  seasonGet: () => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'season_get' }) }),
  seasonSet: (season) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'season_set', season }) }),

  // Sieges
  siegeList: (houseId, activeOnly) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'siege_list', house_id: houseId, active_only: activeOnly ? 1 : 0 }) }),
  siegeGet: (siegeId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'siege_get', siege_id: siegeId }) }),
  siegeStart: (territoryId, attackingHouseId, attackingArmyId) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'siege_start', territory_id: territoryId, attacking_house_id: attackingHouseId, attacking_army_id: attackingArmyId }) }),
  siegeAction: (siegeId, actionType, side, extra) => request('web_settlement.php', { method: 'POST', body: JSON.stringify({ action: 'siege_action', siege_id: siegeId, action_type: actionType, side, ...extra }) }),

  // Settlement Expansion 2 — 10 systems via web_settlement2.php
  // Espionage
  spyList: () => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'spy_list' }) }),
  spyRecruit: (spyName) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'spy_recruit', spy_name: spyName }) }),
  spyMissionStart: (spyId, targetTerritoryId, missionType) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'spy_mission_start', spy_id: spyId, target_territory_id: targetTerritoryId, mission_type: missionType }) }),
  spyMissionResolve: (missionId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'spy_mission_resolve', mission_id: missionId }) }),
  spyReportsList: () => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'spy_reports_list' }) }),
  spyReportView: (reportId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'spy_report_view', report_id: reportId }) }),

  // Supply Lines
  supplyGet: (armyId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'supply_get', army_id: armyId }) }),
  supplyCreate: (armyId, sourceTerritoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'supply_create', army_id: armyId, source_territory_id: sourceTerritoryId }) }),
  supplyCut: (supplyId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'supply_cut', supply_id: supplyId }) }),

  // Court Events & Intrigue
  courtEventList: (houseId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'court_event_list', house_id: houseId }) }),
  courtEventHost: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'court_event_host', ...data }) }),
  courtEventComplete: (eventId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'court_event_complete', event_id: eventId }) }),
  intrigueList: () => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'intrigue_list' }) }),
  intrigueAction: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'intrigue_action', ...data }) }),

  // Underground Economy
  blackmarketGet: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'blackmarket_get', territory_id: territoryId }) }),
  blackmarketCollect: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'blackmarket_collect', territory_id: territoryId }) }),
  blackmarketSuppress: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'blackmarket_suppress', territory_id: territoryId }) }),
  blackmarketEncourage: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'blackmarket_encourage', territory_id: territoryId }) }),
  smugglingList: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'smuggling_list', territory_id: territoryId }) }),
  smugglingCreate: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'smuggling_create', ...data }) }),

  // Crisis Cascades
  crisisList: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'crisis_list', territory_id: territoryId }) }),
  crisisAdvance: (crisisId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'crisis_advance', crisis_id: crisisId }) }),
  crisisResolve: (crisisId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'crisis_resolve', crisis_id: crisisId }) }),

  // Traditions & Festivals
  traditionList: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'tradition_list', territory_id: territoryId }) }),
  traditionObserve: (traditionId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'tradition_observe', tradition_id: traditionId }) }),
  festivalList: (houseId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'festival_list', house_id: houseId }) }),
  festivalHost: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'festival_host', ...data }) }),
  festivalComplete: (festivalId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'festival_complete', festival_id: festivalId }) }),

  // Settlement Interdependence
  supplyRouteList: (houseId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'supply_route_list', house_id: houseId }) }),
  supplyRouteCreate: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'supply_route_create', ...data }) }),
  supplyRouteDisrupt: (routeId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'supply_route_disrupt', route_id: routeId }) }),

  // Colonization
  colonizationList: (houseId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'colonization_list', house_id: houseId }) }),
  colonizationStart: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'colonization_start', ...data }) }),

  // Named NPCs
  npcList: (territoryId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'npc_list', territory_id: territoryId }) }),
  npcInteract: (npcId, interaction) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'npc_interact', npc_id: npcId, interaction }) }),
  npcBribe: (npcId, amount) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'npc_bribe', npc_id: npcId, amount }) }),

  // Diplomacy & Treaties
  treatyList: (houseId, activeOnly) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'treaty_list', house_id: houseId, active_only: activeOnly ? 1 : 0 }) }),
  treatyPropose: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'treaty_propose', ...data }) }),
  treatyAccept: (treatyId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'treaty_accept', treaty_id: treatyId }) }),
  treatyBreak: (treatyId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'treaty_break', treaty_id: treatyId }) }),
  treatyViolations: (treatyId) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'treaty_violations', treaty_id: treatyId }) }),
  treatyViolationReport: (data) => request('web_settlement2.php', { method: 'POST', body: JSON.stringify({ action: 'treaty_violation_report', ...data }) }),

  // Blotter / Moderation
  blotterFile: (data) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'file', ...data }) }),
  blotterMyIncidents: () => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'my_incidents' }) }),
  blotterAgainstMe: () => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'against_me' }) }),
  blotterGet: (id) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'get', incident_id: id }) }),
  blotterList: (filters) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'list', ...filters }) }),
  blotterUpdateStatus: (id, status) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'update_status', incident_id: id, new_status: status }) }),
  blotterAssign: (id) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'assign', incident_id: id }) }),
  blotterResolve: (id, notes) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'resolve', incident_id: id, resolution_notes: notes }) }),
  blotterReopen: (id, reason) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'reopen', incident_id: id, reason }) }),
  blotterWithdraw: (id) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'withdraw', incident_id: id }) }),
  blotterAddNote: (id, note, isInternal) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'add_note', incident_id: id, note, is_internal: isInternal ? 1 : 0 }) }),
  blotterAddEvidence: (id, url, description) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'add_evidence', incident_id: id, url, description }) }),
  blotterApplySanction: (data) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'apply_sanction', ...data }) }),
  blotterListSanctions: (activeOnly) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'list_sanctions', active_only: activeOnly ? 1 : 0 }) }),
  blotterLiftSanction: (id) => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'lift_sanction', sanction_id: id }) }),
  blotterStats: () => request('web_blotter.php', { method: 'POST', body: JSON.stringify({ action: 'stats' }) }),

  // Settlement Expansion 3 — Justice & Crime
  criminalFile: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'criminal_file', ...data }) }),
  criminalList: (territoryId, status) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'criminal_list', territory_id: territoryId, status }) }),
  criminalGet: (recordId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'criminal_get', record_id: recordId }) }),
  criminalUpdateStatus: (recordId, newStatus) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'criminal_update_status', record_id: recordId, new_status: newStatus }) }),
  trialSchedule: (recordId, trialType, scheduledAt) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'trial_schedule', record_id: recordId, trial_type: trialType, scheduled_at: scheduledAt }) }),
  trialConclude: (trialId, verdict, notes) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'trial_conclude', trial_id: trialId, verdict, verdict_notes: notes }) }),
  punishmentApply: (recordId, data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'punishment_apply', record_id: recordId, ...data }) }),

  // Tournaments
  tournamentList: (status, eventType) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_list', status, event_type: eventType }) }),
  tournamentCreate: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_create', ...data }) }),
  tournamentRegister: (tournamentId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_register', tournament_id: tournamentId }) }),
  tournamentParticipants: (tournamentId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_participants', tournament_id: tournamentId }) }),
  tournamentBracket: (tournamentId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_bracket', tournament_id: tournamentId }) }),
  tournamentRecordResult: (roundId, winnerKey, score1, score2, notes) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_record_result', round_id: roundId, winner_key: winnerKey, score1, score2, notes }) }),
  tournamentComplete: (tournamentId, winnerKey, winnerName) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tournament_complete', tournament_id: tournamentId, winner_key: winnerKey, winner_name: winnerName }) }),

  // Weather & Season Effects
  weatherGet: (territoryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'weather_get', territory_id: territoryId }) }),
  weatherSet: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'weather_set', ...data }) }),
  weatherList: () => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'weather_list' }) }),
  weatherClear: (territoryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'weather_clear', territory_id: territoryId }) }),

  // Production Chains
  chainList: () => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'chain_list' }) }),
  chainStart: (chainId, territoryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'chain_start', chain_id: chainId, territory_id: territoryId }) }),
  chainStatus: () => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'chain_status' }) }),
  chainAdvance: (productionId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'chain_advance', production_id: productionId }) }),
  chainCreate: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'chain_create', ...data }) }),

  // Roads & Infrastructure
  roadList: () => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'road_list' }) }),
  roadCreate: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'road_create', ...data }) }),
  roadRepair: (roadId, cost) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'road_repair', road_id: roadId, cost }) }),

  // Vassalage Management
  vassalageList: (houseId, activeOnly) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'vassalage_list', house_id: houseId, active_only: activeOnly ? 1 : 0 }) }),
  vassalageSwear: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'vassalage_swear', ...data }) }),
  vassalageBreak: (vassalageId, reason) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'vassalage_break', vassalage_id: vassalageId, reason }) }),
  tributePay: (vassalageId, amount) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tribute_pay', vassalage_id: vassalageId, amount }) }),
  tributeHistory: (vassalageId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'tribute_history', vassalage_id: vassalageId }) }),

  // Census & Demographics
  censusGet: (territoryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'census_get', territory_id: territoryId }) }),
  censusHistory: (territoryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'census_history', territory_id: territoryId }) }),
  censusRecord: (territoryId, census) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'census_record', territory_id: territoryId, census }) }),

  // Religious Sites
  religiousSiteList: (territoryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'religious_site_list', territory_id: territoryId }) }),
  religiousSiteCreate: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'religious_site_create', ...data }) }),
  religiousSitePray: (siteId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'religious_site_pray', site_id: siteId }) }),

  // Disease Outbreaks
  outbreakList: (status) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'outbreak_list', status }) }),
  outbreakTrigger: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'outbreak_trigger', ...data }) }),
  outbreakContain: (outbreakId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'outbreak_contain', outbreak_id: outbreakId }) }),
  outbreakResolve: (outbreakId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'outbreak_resolve', outbreak_id: outbreakId }) }),
  outbreakUpdate: (outbreakId, infected, deaths) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'outbreak_update', outbreak_id: outbreakId, infected_count: infected, deaths_count: deaths }) }),

  // Heraldry Registry
  heraldryList: (historicalOnly) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'heraldry_list', historical_only: historicalOnly ? 1 : 0 }) }),
  heraldryGet: (houseId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'heraldry_get', house_id: houseId }) }),
  heraldryRegister: (data) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'heraldry_register', ...data }) }),
  heraldryApprove: (heraldryId) => request('web_settlement3.php', { method: 'POST', body: JSON.stringify({ action: 'heraldry_approve', heraldry_id: heraldryId }) }),

  // Lineage / Family Tree
  lineageTree: (houseId) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'tree', house_id: houseId }) }),
  lineageHouseList: () => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'house_list' }) }),
  lineageCharacterAdd: (data) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'character_add', ...data }) }),
  lineageCharacterUpdate: (charId, data) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'character_update', character_id: charId, ...data }) }),
  lineageCharacterDelete: (charId) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'character_delete', character_id: charId }) }),
  lineageCharacterGet: (charId) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'character_get', character_id: charId }) }),
  lineageCharacterLink: (charId, avatarKey) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'character_link', character_id: charId, avatar_key: avatarKey }) }),
  lineageSuccessionSet: (houseId, succession) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'succession_set', house_id: houseId, succession }) }),
  lineageEventAdd: (data) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'event_add', ...data }) }),
  lineageBastardRegister: (data) => request('web_lineage.php', { method: 'POST', body: JSON.stringify({ action: 'bastard_register', ...data }) }),

  // Politics & Governance
  lawPropose: (data) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_propose', ...data }) }),
  lawList: (status) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_list', status }) }),
  lawGet: (lawId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_get', law_id: lawId }) }),
  lawVote: (lawId, vote, comment) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_vote', law_id: lawId, vote, comment }) }),
  lawEnact: (lawId, lawTitle) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_enact', law_id: lawId, law_title: lawTitle }) }),
  lawVeto: (lawId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_veto', law_id: lawId }) }),
  lawRepeal: (lawId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'law_repeal', law_id: lawId }) }),
  decreeIssue: (data) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'decree_issue', ...data }) }),
  decreeList: (activeOnly) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'decree_list', active_only: activeOnly ? 1 : 0 }) }),
  decreeRevoke: (decreeId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'decree_revoke', decree_id: decreeId }) }),
  councilList: () => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'council_list' }) }),
  councilAppoint: (data) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'council_appoint', ...data }) }),
  councilRemove: (seatId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'council_remove', seat_id: seatId }) }),
  councilMySeat: () => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'council_my_seat' }) }),
  petitionSubmit: (data) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'petition_submit', ...data }) }),
  petitionList: (status) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'petition_list', status }) }),
  petitionGet: (petitionId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'petition_get', petition_id: petitionId }) }),
  petitionSign: (petitionId) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'petition_sign', petition_id: petitionId }) }),
  petitionReview: (petitionId, newStatus, notes) => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'petition_review', petition_id: petitionId, new_status: newStatus, review_notes: notes }) }),
  politicsStats: () => request('web_politics.php', { method: 'POST', body: JSON.stringify({ action: 'politics_stats' }) }),

  // Marketplace & Auctions
  auctionList: () => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'auction_list' }) }),
  auctionCreate: (data) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'auction_create', ...data }) }),
  auctionBid: (auctionId, amount) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'auction_bid', auction_id: auctionId, amount }) }),
  auctionBuyout: (auctionId) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'auction_buyout', auction_id: auctionId }) }),
  auctionCancel: (auctionId) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'auction_cancel', auction_id: auctionId }) }),
  myAuctions: () => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'my_auctions' }) }),
  tradeList: () => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'trade_list' }) }),
  tradeCreate: (data) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'trade_create', ...data }) }),
  tradeAccept: (tradeId) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'trade_accept', trade_id: tradeId }) }),
  tradeReject: (tradeId) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'trade_reject', trade_id: tradeId }) }),
  myTrades: () => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'my_trades' }) }),
  caravanList: () => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'caravan_list' }) }),
  caravanCreate: (data) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'caravan_create', ...data }) }),
  caravanDispatch: (caravanId) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'caravan_dispatch', caravan_id: caravanId }) }),
  stallList: () => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'stall_list' }) }),
  stallCreate: (data) => request('web_marketplace.php', { method: 'POST', body: JSON.stringify({ action: 'stall_create', ...data }) }),

  // Notifications
  notificationList: (unreadOnly) => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'list', unread_only: unreadOnly ? 1 : 0 }) }),
  notificationUnreadCount: () => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'unread_count' }) }),
  notificationMarkRead: (id) => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'mark_read', notification_id: id || 0 }) }),
  notificationMarkAllRead: () => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'mark_all_read' }) }),
  notificationDelete: (id) => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'delete', notification_id: id }) }),
  notificationDeleteRead: () => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'delete_read' }) }),
  notificationClearAll: () => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'clear_all' }) }),
  notificationGetPrefs: () => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'get_prefs' }) }),
  notificationSetPref: (type, enabled) => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'set_pref', notification_type: type, enabled: enabled ? 1 : 0 }) }),
  notificationCreate: (data) => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...data }) }),
  notificationBroadcast: (title, body) => request('web_notifications.php', { method: 'POST', body: JSON.stringify({ action: 'broadcast', title, body }) }),
}
