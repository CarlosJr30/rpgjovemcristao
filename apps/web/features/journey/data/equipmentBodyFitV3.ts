/** Exact existing human approval, revalidated by the production build gate. */
export const APPROVED_BODY_FIT_V3 = {
  itemId: 'traveler-armor-uncommon',
  targetId: 'armor_traveler_uncommon_female_v2',
  gender: 'female' as const,
  avatarSource: '/assets/avatar/hd/female/female_short_moss_medium_hd.png',
  avatarSha256:
    'f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460',
  asset:
    '/assets/equipment/overlays/body-fit-v3/armor_traveler_uncommon_female_approved.png',
  assetSha256:
    'ebee2f026c2dd6aac6b47850c8412f243cdc20c51a36d6f91e2d6cf3b46c20cb',
  approvalId: 'TASK-0054-HUMAN-BODY-FIT-APPROVAL',
  sourceSize: { width: 1024, height: 1536 },
} as const;

/** Exact TASK-0075 release scope; visual decisions alone never populate this registry. */
export const APPROVED_BODY_FIT_V3_ASSETS = [
  APPROVED_BODY_FIT_V3,
  {
    itemId: 'traveler-armor-uncommon',
    targetId: 'armor_traveler_uncommon_male_v2',
    gender: 'male',
    avatarSource: '/assets/avatar/hd/male/male_short_moss_medium_hd.png',
    avatarSha256:
      'b182c2e29b512b337891716a413ab7efaad737e23c6354779fae17fe19b8af34',
    asset:
      '/assets/equipment/overlays/body-fit-v3/armor_traveler_uncommon_male_approved.png',
    assetSha256:
      '8ece1c5d4daad2b4b7b0a6d673eb3ad6e2d16a9bcc888082ee33a2bd71c928c2',
    approvalId: 'TASK-0075-HUMAN-VISUAL-DECISIONS',
    sourceSize: { width: 1024, height: 1536 },
  },
  {
    itemId: 'traveler-sword-common',
    targetId: 'sword_path_common_female_v2',
    gender: 'female',
    avatarSource: APPROVED_BODY_FIT_V3.avatarSource,
    avatarSha256: APPROVED_BODY_FIT_V3.avatarSha256,
    asset:
      '/assets/equipment/overlays/body-fit-v3/sword_path_common_female_approved.png',
    assetSha256:
      '735000c62ddaee5214cfb895deae17685a1f2e1c0c642f3557e09879d90524f2',
    approvalId: 'TASK-0075-HUMAN-VISUAL-DECISIONS',
    sourceSize: { width: 1024, height: 1536 },
  },
  {
    itemId: 'traveler-sword-common',
    targetId: 'sword_path_common_male_v2',
    gender: 'male',
    avatarSource: '/assets/avatar/hd/male/male_short_moss_medium_hd.png',
    avatarSha256:
      'b182c2e29b512b337891716a413ab7efaad737e23c6354779fae17fe19b8af34',
    asset:
      '/assets/equipment/overlays/body-fit-v3/sword_path_common_male_approved.png',
    assetSha256:
      '73e29fafd9adec500978eae7bb35eca05e8b79d946862b98704f40e95964aec4',
    approvalId: 'TASK-0075-HUMAN-VISUAL-DECISIONS',
    sourceSize: { width: 1024, height: 1536 },
  },
] as const;
