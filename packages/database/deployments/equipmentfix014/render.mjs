// Offline package renderer only. Never connects to a database or issues recognition.
export function renderRecognition({
  read,
  project,
  scope,
  manifest,
  originMD5,
  constraintMD5,
}) {
  const scopes = {
    wspafhlbtlpabypzymjo: 'guild-ebd-001',
    wkdvdzfkbwvhyjmamrsg: 'hero-equipment-006',
  };
  const hex = /^[0-9a-f]{32}$/;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const expected = {
    'traveler-armor-uncommon': 1,
    'traveler-shield-rare': 1,
    'traveler-helmet-rare': 4,
    'wisdom-amulet': 6,
  };
  if (
    scopes[project] !== scope ||
    !hex.test(originMD5) ||
    !hex.test(constraintMD5) ||
    !uuid.test(manifest.actor) ||
    !uuid.test(manifest.owner) ||
    manifest.contract !== 'RPG-EQUIPMENT-FIX-014:v1' ||
    manifest.approvalRef !== 'OWNER-APPROVED-2026-11-10:FIX-014' ||
    manifest.items.length !== 4 ||
    !uuid.test(manifest.financialApproval.id) ||
    !hex.test(manifest.financialApproval.rowMD5)
  )
    throw Error('Invalid reviewed recognition parameters');
  const ids = new Set(),
    refs = new Set();
  for (const item of manifest.items) {
    if (
      expected[item.itemId] !== item.quantity ||
      ids.has(item.itemId) ||
      !hex.test(item.inventoryRowMD5) ||
      item.legacyReceipts.length !==
        ({ 'traveler-helmet-rare': 3, 'wisdom-amulet': 5 }[item.itemId] ?? 0)
    )
      throw Error('Recognition differs from approved items');
    ids.add(item.itemId);
    for (const ref of item.legacyReceipts) {
      if (!uuid.test(ref.id) || !hex.test(ref.rowMD5) || refs.has(ref.id))
        throw Error('Invalid original receipt reference');
      refs.add(ref.id);
    }
  }
  const readTemplate = read(
    'packages/database/proposals/rpg-equipment-fix-014.sql.in',
  );
  const source = readTemplate
    .slice(
      readTemplate.indexOf('CREATE FUNCTION shop_private.equipment_origin_014'),
      readTemplate.indexOf('CREATE OR REPLACE FUNCTION shop_private.equip'),
    )
    .replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION');
  const recognizedSource = source.replace(
    "THEN RETURN 'acquisition-unconfirmed'; END IF;",
    "THEN\n  IF shop_private.recognition_valid_014(p_owner,p_actor,p_item) THEN RETURN NULL; END IF;\n  RETURN 'acquisition-unconfirmed';\n END IF;",
  );
  if (recognizedSource === source)
    throw Error('Reviewed source predicate not found');
  const substitutions = {
    TARGET_PROJECT: project,
    RELEASE_SCOPE: scope,
    APPROVED_ACTOR: manifest.actor,
    APPROVED_OWNER: manifest.owner,
    PRIOR_ORIGIN_MD5: originMD5,
    PRIOR_LEDGER_CONSTRAINT_MD5: constraintMD5,
    RECOGNITION_MANIFEST_JSON: JSON.stringify(manifest).replaceAll("'", "''"),
    RECOGNITION_ORIGIN_FUNCTION: recognizedSource,
    ORIGINAL_ORIGIN_FUNCTION: source,
  };
  const render = (template) =>
    template.replace(/\{\{([A-Z_0-9]+)\}\}/g, (_, key) => {
      if (!(key in substitutions))
        throw Error('Missing package parameter ' + key);
      return substitutions[key];
    });
  return {
    support: render(
      read(
        'packages/database/proposals/rpg-equipment-fix-014-recognition.sql.in',
      ),
    ),
    containment: render(
      read(
        'packages/database/proposals/rpg-equipment-fix-014-recognition-containment.sql.in',
      ),
    ),
  };
}
