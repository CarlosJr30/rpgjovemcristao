import { resolve } from 'node:path';

const config = {
  devIndicators: false,
  turbopack: { root: resolve(import.meta.dirname, '../../..') },
};
export default config;
