import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerMapResource } from "./mapResource.js"
import { registerRaibotLocationResource } from "./raibotLocationResource.js"
import { registerRaibotHistoryResource } from "./raibotHistoryResource.js"

export function registerResources(server: McpServer): void {
    registerMapResource(server)
    registerRaibotLocationResource(server)
    registerRaibotHistoryResource(server)
}