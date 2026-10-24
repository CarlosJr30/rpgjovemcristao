import { unavailableResponse } from '../../../lib/release-scope';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  void request;
  return unavailableResponse();
}
