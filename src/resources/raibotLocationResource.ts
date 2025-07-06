import { z } from "zod";
import fs from 'fs/promises'; // Use promises for async operations
import path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import logger from "../logger.js"
import { existsSync } from "fs"

// Helper to get the correct directory path in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the JSON file acting as our simple database
const memoryFilePath = path.resolve(__dirname, '../../data/location.json');

export const xSchema = z.number().lt(6).gt(0).describe("The current column (ie: x-coord) of the Raibot");
export const ySchema = z.number().lt(6).gt(0).describe("The current row (ie: y-coord) of the Raibot");

// Zod schema to validate the structure of the memory data
const LocationSchema = z.object({
    x: xSchema,
    y: ySchema
});

// TypeScript type derived from the Zod schema for type safety
export type LocationData = z.infer<typeof LocationSchema>;
export type X = z.infer<typeof xSchema>;
export type Y = z.infer<typeof ySchema>;

async function createEmptyLocation(): Promise<LocationData> {
    const startingGrid: LocationData = {
        x: 1,
        y: 1
    };
    await writeLocation(startingGrid);
    return startingGrid;
}

// Reads and validates the location data from location.json
export async function readLocation(): Promise<LocationData> {
    try {
        if (!existsSync(memoryFilePath)) {
            logger.warn("Memory file is missing, returning default location structure.");
            await createEmptyLocation();
        }

        const data = await fs.readFile(memoryFilePath, 'utf-8');
        var jsonData: any
        if (!data) {
            jsonData = await createEmptyLocation();
        } else {
            jsonData = JSON.parse(data);
        }

        // Ensure the data conforms to our expected schema
        return LocationSchema.parse(jsonData);
    } catch (error) {
        logger.error("Error reading or parsing memory file:", error);
        // For a demo, we throw; a real app might return a default or handle errors differently
        throw new Error(`Failed to read/parse memory file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Validates and writes the given location data to location.json
export async function writeLocation(newData: LocationData): Promise<void> {
    try {
        // Ensure the data to be written conforms to the schema
        LocationSchema.parse(newData);
        const dataString = JSON.stringify(newData, null, 2); // Pretty-print JSON
        await fs.writeFile(memoryFilePath, dataString, 'utf-8');
    } catch (error) {
        logger.error("Error validating or writing memory file:", error);
        throw new Error(`Failed to validate/write memory file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function registerRaibotLocationResource(server: McpServer): void {
    server.resource(
        "Raibot Location",
        "memory://raibot_location",
        async (uri) => {
            const LocationData = await readLocation()
            return {
                contents: [{
                    uri: uri.toString(),
                    mimeType: "application/json",
                    text: JSON.stringify(LocationData, null, 2)
                }]
            }
        }
    )
}
