import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import logger from "../logger.js";

export default function registerHelloWorldTool(server: McpServer) {
  logger.debug("Registering Hello World tool...");
  server.tool(
      "hello_world",
      "A simple tool that introduces itself.",
      {},
      async () => {
        logger.info("Hello triggered...");

        return {
          content: [{
              type: "text",
              text: "Hello, world! This is Raibot's MCP server."
          }]
      }
  })
}