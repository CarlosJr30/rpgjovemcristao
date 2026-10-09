import { describe, expect, it } from 'vitest';
import { BODY_ANCHORS } from './data/bodyAnchors';
import {
  equipmentAnimationAnchor,
  iconFlightGeometry,
  EQUIP_ANIMATION_TIMING,
  EQUIP_FLIGHT_DURATION,
} from './data/equipmentAnimation';

describe('temporary icon flight geometry', () => {
  it.each(['male', 'female'] as const)(
    'uses semantic destinations for %s and the midpoint of both feet',
    (body) => {
      for (const [slot, anchor] of Object.entries({
        helmet: 'head',
        armor: 'torso',
        weapon: 'rightHand',
        shield: 'leftHand',
        amulet: 'chest',
      } as const)) {
        expect(equipmentAnimationAnchor(body, slot as 'helmet')).toEqual(
          BODY_ANCHORS[body][anchor],
        );
      }
      expect(equipmentAnimationAnchor(body, 'boots')).toEqual({
        x: (BODY_ANCHORS[body].leftFoot.x + BODY_ANCHORS[body].rightFoot.x) / 2,
        y: (BODY_ANCHORS[body].leftFoot.y + BODY_ANCHORS[body].rightFoot.y) / 2,
      });
    },
  );
  it('starts at the card center and reaches the semantic anchor, without changing image ratio', () => {
    const geometry = iconFlightGeometry(
      { left: 20, top: 300, width: 64, height: 64 },
      { left: 400, top: 30, width: 240, height: 360 },
      'female',
      'weapon',
      { width: 1440, height: 900 },
    )!;
    expect(geometry.x).toBe(20);
    expect(geometry.y).toBe(300);
    expect(geometry.targetX).toBeCloseTo(
      400 + 240 * BODY_ANCHORS.female.rightHand.x,
    );
    expect(geometry.targetY).toBeCloseTo(
      30 + 360 * BODY_ANCHORS.female.rightHand.y,
    );
    expect(geometry.x + geometry.width / 2 + geometry.dx).toBeCloseTo(
      geometry.targetX,
    );
    expect(geometry.y + geometry.height / 2 + geometry.dy).toBeCloseTo(
      geometry.targetY,
    );
    expect(geometry.arc).toBeGreaterThan(0);
    expect(geometry.arc).toBeLessThanOrEqual(64);
    expect(EQUIP_FLIGHT_DURATION + EQUIP_ANIMATION_TIMING.reveal).toBe(740);
  });
  it('bounds the mobile arc and projects offscreen arrival to the viewport edge', () => {
    const geometry = iconFlightGeometry(
      { left: 24, top: 380, width: 64, height: 64 },
      { left: 60, top: -1000, width: 240, height: 360 },
      'female',
      'helmet',
      { width: 390, height: 844 },
    )!;
    expect(geometry.targetY).toBe(20);
    expect(geometry.arc).toBeLessThanOrEqual(28);
    expect(geometry.width).toBe(64);
  });
  it('rejects invalid geometry rather than producing NaN or zero-size animation', () => {
    const rect = { left: 0, top: 0, width: 64, height: 64 };
    for (const bad of [
      { ...rect, width: 0 },
      { ...rect, top: NaN },
      { ...rect, height: -1 },
    ]) {
      expect(
        iconFlightGeometry(bad, rect, 'male', 'boots', {
          width: 390,
          height: 844,
        }),
      ).toBeNull();
      expect(
        iconFlightGeometry(rect, bad, 'male', 'boots', {
          width: 390,
          height: 844,
        }),
      ).toBeNull();
    }
  });

  it('keeps offscreen desktop endpoints and the middle of the arc visible', () => {
    const geometry = iconFlightGeometry(
      { left: 800, top: -200, width: 64, height: 64 },
      { left: 420, top: -500, width: 240, height: 360 },
      'male',
      'weapon',
      { width: 1440, height: 900 },
    )!;
    expect(geometry.y).toBe(0);
    expect(geometry.targetY).toBe(20);
    expect(
      geometry.y + geometry.height / 2 + geometry.midDy,
    ).toBeGreaterThanOrEqual(geometry.height * 0.53 + 8);
  });
});
