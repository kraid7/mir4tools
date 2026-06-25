// Lista oficial completa de stats/encantamentos do MIR4 (nome + unidade + ícone).
// Fonte: API do xdraco/MIR4 (webapi.mir4global.com/nft/character/stats).
// Ícones em public/icons/stats/. unit: 'percent' (exibe com %) ou 'flat'.

const STAT_ICON_BASE = '/icons/stats'

export const ENCHANTMENTS = [
  { name: 'HP', unit: 'flat', icon: 'Ico_Status_Hp.png' },
  { name: 'HP % REGEN (per 10 sec)', unit: 'percent', icon: 'Ico_Status_HPRecovery.png' },
  { name: 'MP', unit: 'flat', icon: 'Ico_Status_SP.png' },
  { name: 'MP % REGEN (per 10 sec)', unit: 'percent', icon: 'Ico_Status_AddRegenerationMana.png' },
  { name: 'PHYS ATK', unit: 'flat', icon: 'Ico_Status_ADDPhysicalDamage.png' },
  { name: 'Spell ATK', unit: 'flat', icon: 'Ico_Status_ADDMagicDamage.png' },
  { name: 'PHYS DEF', unit: 'flat', icon: 'Ico_Status_DefensePhysical.png' },
  { name: 'Spell DEF', unit: 'flat', icon: 'Ico_Status_DefenseMagic.png' },
  { name: 'Accuracy', unit: 'flat', icon: 'Ico_Status_Accuracy.png' },
  { name: 'EVA', unit: 'flat', icon: 'Ico_Status_Dodge.png' },
  { name: 'CRIT', unit: 'flat', icon: 'Ico_Status_Critical.png' },
  { name: 'CRIT EVA', unit: 'flat', icon: 'Ico_Status_AvoidCritical.png' },
  { name: 'CRIT ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_CriticalOutcome.png' },
  { name: 'CRIT DMG Reduction', unit: 'percent', icon: 'Ico_Status_AddDefCriticalOutcome.png' },
  { name: 'Bash ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_AddSmiteSkillDamage.png' },
  { name: 'Bash DMG Reduction', unit: 'percent', icon: 'Ico_Status_AddDefSmiteSkillDamage.png' },
  { name: 'Antidemon Power', unit: 'percent', icon: 'Ico_Status_AddAtkDemonsDamage.png' },
  { name: 'PvP ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_ADDPVPDamagePer.png' },
  { name: 'PvP DMG Reduction', unit: 'percent', icon: 'Ico_Status_FallPVPDamagePer.png' },
  { name: 'Monster ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_AtkNormalMonDamagePer.png' },
  { name: 'Boss ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_ADDBossDamagePer.png' },
  { name: 'Monster DMG Reduction', unit: 'percent', icon: 'Ico_Status_AddDefNormalMonDamage.png' },
  { name: 'Boss DMG Reduction', unit: 'percent', icon: 'Ico_Status_FallBossDamagePer.png' },
  { name: 'Skill ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_ADDMagicDamagePer.png' },
  { name: 'Skill DMG Reduction', unit: 'percent', icon: 'Ico_Status_AddDefSkillDamage.png' },
  { name: 'All ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_ADDAllDamagePer.png' },
  { name: 'All DMG Reduction', unit: 'percent', icon: 'Ico_Status_FallAllDamagePer.png' },
  { name: 'Stun Success Boost', unit: 'percent', icon: 'Ico_Status_AddStunPer.png' },
  { name: 'Stun RES Boost', unit: 'percent', icon: 'Ico_Status_AddDefStunPer.png' },
  { name: 'Debilitation Success Boost', unit: 'percent', icon: 'Ico_Status_AddDeBuffPer.png' },
  { name: 'Debilitation RES Boost', unit: 'percent', icon: 'Ico_Status_AddDefDeBuffPer.png' },
  { name: 'Silence Success Boost', unit: 'percent', icon: 'Ico_Status_AddCursePer.png' },
  { name: 'Silence RES Boost', unit: 'percent', icon: 'Ico_Status_AddDefCursePer.png' },
  { name: 'Hunting EXP Boost', unit: 'percent', icon: 'Ico_Status_HuntExpPer.png' },
  { name: 'Hunting Copper Gain Boost', unit: 'percent', icon: 'Ico_Status_HuntGoldPer.png' },
  { name: 'Energy Gain Boost', unit: 'percent', icon: 'Ico_Status_RatioGetSpirit.png' },
  { name: 'Darksteel Gain Boost', unit: 'percent', icon: 'Ico_Status_BlackIronEarning_Increase.png' },
  { name: 'Drop Chance Boost', unit: 'percent', icon: 'Ico_Status_RatioRewardDrop.png' },
  { name: 'Lucky Drop Chance Boost', unit: 'percent', icon: 'Ico_Status_LuckDrop.png' },
  { name: 'Gathering Boost', unit: 'percent', icon: 'Ico_Status_MiningTime_Decrease.png' },
  { name: 'Energy Gathering Boost', unit: 'percent', icon: 'Ico_Status_RatioFallMeditationTime.png' },
  { name: 'Mining Boost', unit: 'percent', icon: 'Ico_Status_FoaagingTime_Decrease.png' },
  { name: 'Skill Cooldown Reduction', unit: 'percent', icon: 'Ico_Status_ReduceSkillCoolTime.png' },
  { name: 'MP Cost Reduction', unit: 'percent', icon: 'Ico_Status_SPCostPer.png' },
  { name: 'Knockdown Success Boost', unit: 'percent', icon: 'Ico_Status_AddKnockDownPer.png' },
  { name: 'Knockdown RES Boost', unit: 'percent', icon: 'Ico_Status_AddDefKnockDownPer.png' },
  { name: 'HP Potion Effect Boost', unit: 'percent', icon: 'Ico_Status_AddItemHPHealBooster.png' },
  { name: 'MP Potion Effect Boost', unit: 'percent', icon: 'Ico_Status_AddItemMPHealBooster.png' },
  { name: "Skill HP Recovery Am't Boost", unit: 'percent', icon: 'Ico_Status_AddSkillHPHealBooster.png' },
  { name: 'Life', unit: 'flat', icon: 'ServerVisitLife_Info.png' },
  { name: 'Basic ATK DMG Boost', unit: 'percent', icon: 'Ico_Status_AddNormalAtkDamage.png' },
  { name: 'Basic DMG Reduction', unit: 'percent', icon: 'Ico_Status_AddNormalAtkDefense.png' },
  { name: 'Divine Water Cooldown Reduction', unit: 'percent', icon: 'Ico_Status_DecreaseDivineWaterCoolTime.png' },
  { name: 'Box Open Time Boost', unit: 'percent', icon: 'Ico_Status_DecreaseBoxCastingTime.png' },
  { name: 'Solitude Training Success Chance Boost', unit: 'percent', icon: 'Ico_Status_AddClosedTrainingPer.png' },
  { name: 'Equipment Enhancement Success Chance Boost (UC)', unit: 'percent', icon: 'Ico_Status_AddUCEquipmentEnchant.png' },
  { name: 'Equipment Enhancement Success Chance Boost (R)', unit: 'percent', icon: 'Ico_Status_AddREquipmentEnchant.png' },
  { name: 'Equipment Enhancement Success Chance Boost (E)', unit: 'percent', icon: 'Ico_Status_AddEEquipmentEnchant.png' },
  { name: 'Equipment Enhancement Success Chance Boost (L)', unit: 'percent', icon: 'Ico_Status_AddLEquipmentEnchant.png' },
  { name: 'Equipment Enhancement Success Chance Boost (UC-L)', unit: 'percent', icon: 'Ico_Status_AddAEquipmentEnchant.png' },
  { name: 'Dragon Artifact Enhancement Success Chance Boost (R)', unit: 'percent', icon: 'Ico_Status_AddRDragonArtifactEnchant.png' },
  { name: 'Dragon Artifact Enhancement Success Chance Boost (E)', unit: 'percent', icon: 'Ico_Status_AddEDragonArtifactEnchant.png' },
  { name: 'Dragon Artifact Enhancement Success Chance Boost (L)', unit: 'percent', icon: 'Ico_Status_AddLDragonArtifactEnchant.png' },
  { name: 'Dragon Artifact Enhancement Success Chance Boost (UC-L)', unit: 'percent', icon: 'Ico_Status_AddADragonArtifactEnchant.png' },
  { name: 'Max Vigor Boost (sec)', unit: 'flat', icon: 'Ico_Status_AddMaxVigorRecharge.png' },
  { name: 'Monster Accuracy Boost', unit: 'flat', icon: 'Ico_Status_AddNormalMonAccuracy.png' },
  { name: 'Monster EVA Boost', unit: 'flat', icon: 'Ico_Status_AddNormalMonDodge.png' },
]

// Nome oficial em PT-BR de cada stat (mapeado pelo nome em inglês). Extraído da
// mesma API do MIR4 (languageCode=pt), cruzando pelo ícone. Usado só pelo OCR,
// para reconhecer prints do jogo em português. O app continua armazenando o
// nome canônico em inglês.
export const ENCHANT_PT_ALIASES = {
  HP: 'HP',
  'HP % REGEN (per 10 sec)': 'REGENERAÇÃO DE % DE HP (cada 10s)',
  MP: 'MP',
  'MP % REGEN (per 10 sec)': 'REGENERAÇÃO DE % DE MP (cada 10s)',
  'PHYS ATK': 'ATAQUE FÍSICO',
  'Spell ATK': 'ATAQUE de Feitiço',
  'PHYS DEF': 'DEFESA FÍSICA',
  'Spell DEF': 'DEFESA contra feitiços',
  Accuracy: 'Precisão',
  EVA: 'EVASÃO',
  CRIT: 'CRÍTICO',
  'CRIT EVA': 'EVASÃO DE CRÍTICO',
  'CRIT ATK DMG Boost': 'Aumento do DANO DE ATAQUE CRÍTICO',
  'CRIT DMG Reduction': 'Redução do DANO CRÍTICO Recebido',
  'Bash ATK DMG Boost': 'Aumento do DANO DE ATAQUE de Esmagamento',
  'Bash DMG Reduction': 'Redução do DANO de Esmagamento Recebido',
  'Antidemon Power': 'Poder Antidemônio',
  'PvP ATK DMG Boost': 'Aumento do DANO DE ATAQUE em PvP',
  'PvP DMG Reduction': 'Redução do DANO em PvP Recebido',
  'Monster ATK DMG Boost': 'Aumento do DANO DE ATAQUE de Monstros',
  'Boss ATK DMG Boost': 'Aumento de DANO DE ATAQUE do Boss',
  'Monster DMG Reduction': 'Redução do DANO Recebido de Monstros',
  'Boss DMG Reduction': 'Redução do DANO Recebido do Boss',
  'Skill ATK DMG Boost': 'Aumento de DANO DE ATAQUE de Habilidade',
  'Skill DMG Reduction': 'Redução do DANO de Habilidade Recebido',
  'All ATK DMG Boost': 'Aumento de Todo o DANO DE ATAQUE',
  'All DMG Reduction': 'Redução de Todo o DANO Recebido',
  'Stun Success Boost': 'Aumento da Probabilidade de Sucesso de Atordoar',
  'Stun RES Boost': 'Aumento de RESISTÊNCIA a Atordoar',
  'Debilitation Success Boost': 'Aumento da Probabilidade de Sucesso de Debilitação',
  'Debilitation RES Boost': 'Aumento de RESISTÊNCIA à Debilitação',
  'Silence Success Boost': 'Aumento da Probabilidade de Sucesso de Silenciar',
  'Silence RES Boost': 'Aumento de RESISTÊNCIA a Silenciar',
  'Hunting EXP Boost': 'Aumento de EXP de Caça',
  'Hunting Copper Gain Boost': 'Aumento de Ganho de Cobre de Caça',
  'Energy Gain Boost': 'Aumento de Ganho de Energia',
  'Darksteel Gain Boost': 'Aumento de Ganho de Aço Negro',
  'Drop Chance Boost': 'Aumento da Probabilidade de Obtenção',
  'Lucky Drop Chance Boost': 'Aumento da Probabilidade de Obtenção de Sorte',
  'Gathering Boost': 'Aceleramento do Tempo de Recolha',
  'Energy Gathering Boost': 'Aceleramento do Tempo de Recolha de Energia',
  'Mining Boost': 'Aceleramento de Tempo de Mineração',
  'Skill Cooldown Reduction': 'Redução do Cooldown de Habilidade',
  'MP Cost Reduction': 'Redução do Custo de MP',
  'Knockdown Success Boost': 'Aumento da Probabilidade de Sucesso de Derrubar',
  'Knockdown RES Boost': 'Aumento de RESISTÊNCIA a Derrubar',
  'HP Potion Effect Boost': 'Aumento do Efeito da Poção de HP',
  'MP Potion Effect Boost': 'Aumento do Efeito da Poção de MP',
  "Skill HP Recovery Am't Boost": 'Aumento de Quantidade de Recuperação de HP de Habilidade',
  Life: 'Vida',
  'Basic ATK DMG Boost': 'Aumento do DANO DE ATAQUE Básico',
  'Basic DMG Reduction': 'Redução do DANO DE ATAQUE Básico Recebido',
  'Divine Water Cooldown Reduction': 'Redução do Cooldown de Água Divina',
  'Box Open Time Boost': 'Aceleramento do Tempo de Abertura de Caixa',
  'Solitude Training Success Chance Boost': 'Aumento da Probabilidade no Sucesso de Treino Ermo',
  'Equipment Enhancement Success Chance Boost (UC)':
    'Aumento da Chance de Sucesso do Aprimoramento de Equipamento (Incomum)',
  'Equipment Enhancement Success Chance Boost (R)':
    'Aumento da Chance de Sucesso do Aprimoramento de Equipamento (Raro)',
  'Equipment Enhancement Success Chance Boost (E)':
    'Aumento da Chance de Sucesso do Aprimoramento de Equipamento (Épico)',
  'Equipment Enhancement Success Chance Boost (L)':
    'Aumento da Chance de Sucesso do Aprimoramento de Equipamento (Lendário)',
  'Equipment Enhancement Success Chance Boost (UC-L)':
    'Aumento da Chance de Sucesso do Aprimoramento de Equipamento (de Incomum até Lendário)',
  'Dragon Artifact Enhancement Success Chance Boost (R)':
    'Aumento da Chance de Sucesso do Aprimoramento de Artefato de Dragão (Raro)',
  'Dragon Artifact Enhancement Success Chance Boost (E)':
    'Aumento da Chance de Sucesso do Aprimoramento de Artefato de Dragão (Épico)',
  'Dragon Artifact Enhancement Success Chance Boost (L)':
    'Aumento da Chance de Sucesso do Aprimoramento de Artefato de Dragão (Lendário)',
  'Dragon Artifact Enhancement Success Chance Boost (UC-L)':
    'Aumento da Chance de Sucesso do Aprimoramento de Artefato de Dragão (de Incomum até Lendário)',
  'Max Vigor Boost (sec)': 'Aumento de Vigor Máximo (segundos)',
  'Monster Accuracy Boost': 'Aumento de Precisão em Monstros',
  'Monster EVA Boost': 'Aumento de EVASÃO de Monstros',
}

const ENCHANT_BY_NAME = Object.fromEntries(ENCHANTMENTS.map((e) => [e.name, e]))

// Mapa nome -> unidade, para preencher a unidade automaticamente ao escolher
// um encantamento conhecido no cadastro.
export const ENCHANT_UNIT_BY_NAME = Object.fromEntries(
  ENCHANTMENTS.map((e) => [e.name, e.unit]),
)

// Caminho do ícone do encantamento (ou null se nome desconhecido).
export function enchantIconPath(name) {
  const e = ENCHANT_BY_NAME[name]
  return e ? `${STAT_ICON_BASE}/${e.icon}` : null
}
