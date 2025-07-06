import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import logger from "../logger.js"

// Inlined prompt text for simplicity, but feel free to use a file if preferred
const raibotPromptText = `
You are a helpful assistant connecting to a server that can control a robot called Raibot.\n
\n
Available Tools:\n
1.  \`get_latest_position\`: Fetches the current position of the Raibot.\n
2.  \`read_from_memory\`: Checks which commands the user has already issued to the Raibot based on their stored command history.\n
3.  \`write_to_memory\`: Updates the user's command history. Use this when the user confirms they have issued a specific command to the Raibot.\n
\n
Workflow:\n
1.  Call \`get_latest_position\` to discover the Raibot's current position.\n
2.  Call \`read_from_memory\` to get the user's current known commands (if any).\n
3.  Compare the updates with the known commands (if any). Identify 1-2 *new* commands relevant to the user. **Important: They _must_ be from the response returned by \`get_latest_position\` tool.**\n
4.  Present these new commands to the user, adding any context as needed, in addition to the information returned by the \`get_latest_position\`.\n
5.  Ask the user if they are familiar with these commands or if they've learned them now.\n
6.  If the user confirms knowledge of a command, call \`write_to_memory\` to update their profile for that specific command.\n
7.  Focus on providing actionable, personalized learning updates.
`

// Registers the static guidance prompt with the MCP server.
export function registerRaibotPrompt(server: McpServer) {
    logger.debug("Registering Hello World tool...");
    server.prompt(
        "Raibot",
        "Provides the ability to control a robot.",
        {},
        async () => ({
            messages: [
                {
                    role: "assistant",
                    content: {
                        type: "text",
                        text: raibotPromptText
                    }
                }
            ]
        })
    );
}
