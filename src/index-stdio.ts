import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPrompts } from "./prompts/promptRegistration.js";
import { registerResources } from "./resources/resourceRegistration.js";
import { registerTools } from "./tools/toolRegistration.js";
import logger from "./logger.js";

logger.debug("Starting MCP server...");

// Initialize the MCP Server instance
const server = new McpServer({
    name: "raibot", // Unique name for this server
    version: "0.0.1", // Server version
    // Declare the types of capabilities the server will offer
    capabilities: {
        prompts: {},  // Will be populated by registerPrompts
        resources: {},// Will be populated by registerResources
        tools: {},    // Will be populated by registerTools
    }
});

// Load and register all defined prompts, resources, and tools
registerPrompts(server);
registerResources(server);
registerTools(server);

logger.debug("MCP server configured");

// Main entry point for the server application
async function main(): Promise<void> {
    // Use StdioServerTransport to communicate over standard input/output
    // This is common for MCP servers launched as child processes by clients.
    const transport = new StdioServerTransport();
    // Connect the server logic to the transport layer
    await server.connect(transport);
}

// Start the server and handle potential errors
main().catch((error: Error) => {
    logger.error("Server startup failed:", error); // Log errors to stderr
    process.exit(1);
});