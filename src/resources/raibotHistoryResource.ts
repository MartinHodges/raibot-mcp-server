import { z } from "zod"
import fs from 'fs/promises' // Use promises for async operations
import path from 'path'
import { fileURLToPath } from 'url'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import logger from "../logger.js"
import { existsSync } from "fs"

// Helper to get the correct directory path in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Path to the JSON file acting as our simple database
const memoryFilePath = path.resolve(__dirname, '../../data/history.json')

export const xSchema = z.number().lt(6).gt(0).describe("The column (ie: x-coord) of the Raibot between 1 and 5")
export const ySchema = z.number().lt(6).gt(0).describe("The row (ie: y-coord) of the Raibot between 1 and 5")

// Zod schema to validate the structure of the memory data
const EventSchema = z.object({
    fromX: xSchema,
    fromY: ySchema,
    toX: xSchema,
    toY: ySchema,
    instruction: z.string().describe("The instruction"),
    result: z.string().describe("The result of the instruction")
})

const EventsSchema = z.array(EventSchema)

// TypeScript type derived from the Zod schema for type safety
export type EventData = z.infer<typeof EventSchema>
export type EventsData = z.infer<typeof EventsSchema>
export type X = z.infer<typeof xSchema>
export type Y = z.infer<typeof ySchema>

export async function restart(atX: X, atY: Y): Promise<EventsData> {
    const events: EventsData = [{
        fromX: atX,
        fromY: atY,
        toX: atX,
        toY: atY,
        instruction: "Start at given location",
        result: "History reset"
    }]
    const jsonData = JSON.stringify(events)
    await fs.writeFile(memoryFilePath, jsonData, 'utf-8')

    return events
}

// Reads and validates the location data from location.json
export async function readHistory(): Promise<EventsData> {
    try {
        if (!existsSync(memoryFilePath)) {
            logger.warn("Memory file is missing, returning default location 1,1.")
            await restart(1,1)
        }
        
        const data = await fs.readFile(memoryFilePath, 'utf-8')
        // Ensure the data conforms to our expected schema
        return EventsSchema.parse(JSON.parse(data))
    } catch (error) {
        logger.error("Error reading or parsing history memory file:", error)
        throw new Error(`Failed to read/parse history memory file: ${error instanceof Error ? error.message : String(error)}`)
    }
}

// Validates and writes the given location data to location.json
export async function appendToHistory(step: EventData): Promise<void> {
    try {
        const history = await readHistory()
        history.concat(step)

        // Ensure the data to be written conforms to the schema
        EventsSchema.parse(history)
        const dataString = JSON.stringify(history, null, 2)
        await fs.writeFile(memoryFilePath, dataString, 'utf-8')
    } catch (error) {
        logger.error("Error validating or writing history memory file:", error)
        throw new Error(`Failed to validate/write history memory file: ${error instanceof Error ? error.message : String(error)}`)
    }
}

export function registerRaibotHistoryResource(server: McpServer): void {
    server.resource(
        "Raibot History",
        "memory://raibot_history",
        async (uri) => {
            const EventsData = await readHistory()
            return {
                contents: [{
                    uri: uri.toString(),
                    mimeType: "application/json",
                    text: JSON.stringify(EventsData, null, 2)
                }]
            }
        }
    )
}
