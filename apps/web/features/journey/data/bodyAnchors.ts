export const AVATAR_CANVAS = { width: 512, height: 768 } as const;
export type BodyType = 'male' | 'female';
export type BodyAnchor = 'head' | 'neck' | 'chest' | 'rightHand' | 'leftHand' | 'leftFoot' | 'rightFoot' | 'back';
export type NormalizedPoint = { x: number; y: number };

// Measured against the full 512 × 768 front-facing runtime sprites, not the visible alpha bounds.
// X/Y stay stable when the composite is resized or CSS zoom changes.
export const BODY_ANCHORS: Readonly<Record<BodyType, Readonly<Record<BodyAnchor, NormalizedPoint>>>> = {
  male: {
    head: { x: .500, y: .102 }, neck: { x: .526, y: .197 }, chest: { x: .500, y: .339 },
    rightHand: { x: .762, y: .548 }, leftHand: { x: .242, y: .545 },
    leftFoot: { x: .320, y: .933 }, rightFoot: { x: .690, y: .933 }, back: { x: .580, y: .380 },
  },
  female: {
    head: { x: .496, y: .100 }, neck: { x: .515, y: .202 }, chest: { x: .496, y: .338 },
    rightHand: { x: .752, y: .542 }, leftHand: { x: .251, y: .542 },
    leftFoot: { x: .326, y: .925 }, rightFoot: { x: .686, y: .925 }, back: { x: .590, y: .380 },
  },
};

export function bodyAnchorPoint(bodyType: BodyType, anchor: BodyAnchor): { x: number; y: number } {
  const point = BODY_ANCHORS[bodyType][anchor];
  return { x: point.x * AVATAR_CANVAS.width, y: point.y * AVATAR_CANVAS.height };
}
