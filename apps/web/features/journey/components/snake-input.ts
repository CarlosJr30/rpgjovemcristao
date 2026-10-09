export type SnakeDirection =
  'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright';

/** Independent sources keep one finger/key from releasing another. */
export class SnakeInput {
  private keys = new Set<string>();
  private pointers = new Map<number, SnakeDirection>();

  key(key: string, pressed: boolean) {
    if (pressed) this.keys.add(key.toLowerCase());
    else this.keys.delete(key.toLowerCase());
  }

  pointer(id: number, direction: SnakeDirection | null) {
    if (direction) this.pointers.set(id, direction);
    else this.pointers.delete(id);
  }

  has(direction: SnakeDirection) {
    const aliases = {
      arrowup: 'w',
      arrowdown: 's',
      arrowleft: 'a',
      arrowright: 'd',
    };
    return (
      this.keys.has(direction) ||
      this.keys.has(aliases[direction]) ||
      [...this.pointers.values()].includes(direction)
    );
  }

  axis() {
    return {
      x: Number(this.has('arrowright')) - Number(this.has('arrowleft')),
      y: Number(this.has('arrowdown')) - Number(this.has('arrowup')),
    };
  }

  clear() {
    this.keys.clear();
    this.pointers.clear();
  }
}
