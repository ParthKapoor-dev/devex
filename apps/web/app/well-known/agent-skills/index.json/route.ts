import { jsonResponse } from "@/lib/text-response";
import { agentSkillsIndex } from "@/lib/well-known";

/**
 * `/.well-known/agent-skills/index.json` — what an agent can get done here.
 *
 * Each entry names the capability, how to reach it, and whether a program can
 * use it unattended. Two of the five need a browser session; saying so here is
 * more useful than letting something find out at the 401.
 */

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(agentSkillsIndex(), "application/json; charset=utf-8");
}
