export const AVATAR_CANVAS = { width: 512, height: 768 } as const;
export type BodyType = 'male' | 'female';
export type BodyAnchor =
  | 'head'
  | 'neck'
  | 'torso'
  | 'chest'
  | 'rightHand'
  | 'leftHand'
  | 'leftFoot'
  | 'rightFoot'
  | 'back';
export type NormalizedPoint = { x: number; y: number };

// Measured against the full 512 × 768 front-facing runtime sprites, not the visible alpha bounds.
// X/Y stay stable when the composite is resized or CSS zoom changes.
export const BODY_ANCHORS: Readonly<
  Record<BodyType, Readonly<Record<BodyAnchor, NormalizedPoint>>>
> = {
  male: {
    head: { x: 0.5, y: 0.102 },
    neck: { x: 0.526, y: 0.197 },
    torso: { x: 0.5, y: 0.38 },
    chest: { x: 0.5, y: 0.339 },
    rightHand: { x: 0.762, y: 0.548 },
    leftHand: { x: 0.242, y: 0.545 },
    leftFoot: { x: 0.32, y: 0.933 },
    rightFoot: { x: 0.69, y: 0.933 },
    back: { x: 0.58, y: 0.38 },
  },
  female: {
    head: { x: 0.496, y: 0.1 },
    neck: { x: 0.515, y: 0.202 },
    torso: { x: 0.496, y: 0.38 },
    chest: { x: 0.496, y: 0.338 },
    rightHand: { x: 0.752, y: 0.542 },
    leftHand: { x: 0.251, y: 0.542 },
    leftFoot: { x: 0.326, y: 0.925 },
    rightFoot: { x: 0.686, y: 0.925 },
    back: { x: 0.59, y: 0.38 },
  },
};

export function bodyAnchorPoint(
  bodyType: BodyType,
  anchor: BodyAnchor,
): { x: number; y: number } {
  const point = BODY_ANCHORS[bodyType][anchor];
  return {
    x: point.x * AVATAR_CANVAS.width,
    y: point.y * AVATAR_CANVAS.height,
  };
}
