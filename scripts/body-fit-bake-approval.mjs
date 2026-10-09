export function approvalMatches(approval, metadata, metadataSha256) {
  return Boolean(
    approval?.reviewStatus === 'HUMAN_BODY_FIT_APPROVED' &&
    approval.humanBodyFitApproved === true &&
    approval.reviewedBy === 'Carlos Faustino' &&
    approval.task === 'TASK-0054' &&
    approval.itemId === 'traveler-armor-uncommon' &&
    approval.gender === 'female' &&
    approval.assetFilename === 'armor_traveler_uncommon_female_v2_baked.png' &&
    approval.sha256 === metadata.output.sha256 &&
    approval.bakeMetadataSha256 === metadataSha256 &&
    approval.referenceAvatar?.id === 'female_short_moss_medium' &&
    approval.referenceAvatar.path === metadata.avatar.path &&
    approval.referenceAvatar.sha256 === metadata.avatar.sha256 &&
    approval.referenceAvatar.gender === 'female',
  );
}
