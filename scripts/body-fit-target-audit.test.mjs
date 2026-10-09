import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readyEligibility,
  validateTargetMapping,
} from './body-fit-target-audit.mjs';

const target = {
  filename: 'armor_traveler_uncommon_female_v2.png',
  itemId: 'traveler-armor-uncommon',
  gender: 'female',
  slot: 'armor',
};
test('delivered target/source_file manifest maps by its explicit target field', () => {
  assert.equal(
    validateTargetMapping(target.filename, target, {
      target: target.filename,
      source_file: 'original-art.png',
    }).status,
    'MAPPED',
  );
  assert.equal(
    validateTargetMapping(target.filename, target, {
      target: 'armor_traveler_rare_female_v2.png',
    }).status,
    'MAPPING_ERROR',
  );
});
test('exact target filename permits mapping without making a fit claim', () => {
  assert.equal(
    validateTargetMapping(target.filename, target, null).status,
    'MAPPED',
  );
});
test('contradictory gender, slot or item metadata is MAPPING_ERROR', () => {
  for (const [field, value] of [
    ['gender', 'male'],
    ['slot', 'boots'],
    ['itemId', 'traveler-armor-rare'],
  ])
    assert.equal(
      validateTargetMapping(target.filename, target, {
        ...target,
        [field]: value,
      }).status,
      'MAPPING_ERROR',
    );
});
test('wrong filename or conflicting target binding cannot be guessed', () => {
  assert.equal(
    validateTargetMapping('armor_traveler_uncommon_male_v2.png', target, null)
      .status,
    'MAPPING_ERROR',
  );
  assert.equal(
    validateTargetMapping(target.filename, target, {
      ...target,
      targetFilename: 'armor_traveler_rare_female_v2.png',
    }).status,
    'MAPPING_ERROR',
  );
});
test('a target plan with inconsistent filename gender is rejected', () => {
  assert.equal(
    validateTargetMapping(target.filename, { ...target, gender: 'male' }, null)
      .status,
    'MAPPING_ERROR',
  );
});
test('technical pass and exact mapping are insufficient for READY', () => {
  assert.equal(
    readyEligibility({
      technical: 'TECHNICALLY_VALIDATED',
      mapping: 'MAPPED',
      fit: 'FIT_VALIDATION_PENDING',
      humanBodyFitApproved: false,
    }),
    false,
  );
});
test('even FIT_PASS is insufficient without explicit human Body-Fit approval', () => {
  assert.equal(
    readyEligibility({
      technical: 'TECHNICALLY_VALIDATED',
      mapping: 'MAPPED',
      fit: 'FIT_PASS',
      humanBodyFitApproved: false,
    }),
    false,
  );
});
test('all gate prerequisites are required, and an eligibility result is not promotion', () => {
  const approved = {
    technical: 'TECHNICALLY_VALIDATED',
    mapping: 'MAPPED',
    fit: 'FIT_PASS',
    humanBodyFitApproved: true,
  };
  assert.equal(readyEligibility(approved), true);
  assert.equal(
    readyEligibility({ ...approved, mapping: 'MAPPING_ERROR' }),
    false,
  );
  assert.equal(
    readyEligibility({ ...approved, technical: 'TECHNICAL_FAIL' }),
    false,
  );
});
