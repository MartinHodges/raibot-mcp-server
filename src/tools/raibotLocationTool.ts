import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import logger from "../logger.js"
import { LocationData, readLocation } from "../resources/raibotLocationResource.js"

export default function registerLocationTool(server: McpServer) {
  logger.debug("Registering Raibot location tool...")
  server.tool(
    "raibot_location",
    "A tool that provides the current location of a simulated Raibot.",
    {readOnlyHint: true},
    async () => {
      logger.debug("Raibot location requested")

      try {
        const location: LocationData = await readLocation()
        return {
          content: [{
              type: "text",
              text: location.x + "," + location.y
          }]
        }
      } catch (error) {
        logger.error("Error reading Raibot's location:", error)
        throw new Error(`Error reading Raibot's location: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  )
}