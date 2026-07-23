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
  getDiseases: () =>
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
  tradeAccept: (tradeId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_accept', trade_id: tradeId }) }),
  tradeReject: (tradeId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_reject', trade_id: tradeId }) }),
  tradeCancel: (tradeId) => request('web_community.php', { method: 'POST', body: JSON.stringify({ action: 'trade_cancel', trade_id: tradeId }) }),

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
  creatureList: (search = '') => request('web_admin.php', { method: 'POST', body: JSON.stringify({ action: 'creature_list', search }) }),
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
  religionPowers: () => request('web_religion.php', { method: 'POST', body: JSON.stringify({ action: 'powers' }) })
}
