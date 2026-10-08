import { preflight, staticJson } from "@/lib/agent-api";
import { PUBLIC_URL } from "@/lib/api";
import { RULES } from "@/lib/refund";

export function GET() {
  return staticJson({ ...RULES, docs: `${PUBLIC_URL}/openapi.json`, calculator: `${PUBLIC_URL}/api/refund` });
}
export const OPTIONS = preflight;
