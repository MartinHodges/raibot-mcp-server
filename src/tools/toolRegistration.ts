import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import registerHelloWorldTool from "./helloWorldTool.js"
import registerRaibotTool from "./raibotSimulatorTool.js"
import registerLocationTool from "./raibotLocationTool.js"

export function registerTools(server: McpServer): void {
    registerHelloWorldTool(server)
    registerRaibotTool(server)
    registerLocationTool(server)
}