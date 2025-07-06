import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerRaibotPrompt } from "./raibotPrompt.js"

export function registerPrompts(server: McpServer): void {
    registerRaibotPrompt(server)
}