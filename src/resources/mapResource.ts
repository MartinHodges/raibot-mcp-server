import { z } from "zod";
import fs from 'fs/promises'; // Use promises for async operations
import path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import logger from "../logger.js"
import { existsSync } from "fs"
import { LocationData } from "./raibotLocationResource.js"

// Helper to get the correct directory path in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the JSON file acting as our simple database
const memoryFilePath = path.resolve(__dirname, '../../data/map.json');

const TileSchema = z.enum(['?', 'X', ' '])
type TileType = z.infer<typeof TileSchema>

// Zod schema to validate the structure of the memory data
const MapSchema = z.object({
    tiles: TileSchema.array().length(5).array().length(5).describe("The 5x5 tiles in the map, where '?' is unknown, 'X' is an obstacle, and ' ' is a clear path"),
});

// TypeScript type derived from the Zod schema for type safety
export type MapData = z.infer<typeof MapSchema>;

export async function createEmptyMap(): Promise<MapData> {
    logger.debug("Resetting map")
    const startingGrid: MapData = {tiles: [
        ['?', '?', '?', '?', '?'],
        ['?', '?', '?', '?', '?'],
        ['?', '?', '?', '?', '?'],
        ['?', '?', '?', '?', '?'],
        ['?', '?', '?', '?', '?']
    ]};
    await writeMap(startingGrid);
    return startingGrid;
}

// Reads and validates the map data from map.json
export async function readMap(): Promise<MapData> {
    try {
        if (!existsSync(memoryFilePath)) {
            logger.warn("Memory file is missing, returning default map structure.");
            await createEmptyMap();
        }

        const data = await fs.readFile(memoryFilePath, 'utf-8');
        var jsonData: any
        if (!data) {
            jsonData = await createEmptyMap();
        } else {
            jsonData = JSON.parse(data);
        }

        // Ensure the data conforms to our expected schema
        return MapSchema.parse(jsonData);
    } catch (error) {
        logger.error("Error reading or parsing memory file:", error);
        // For a demo, we throw; a real app might return a default or handle errors differently
        throw new Error(`Failed to read/parse memory file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Validates and writes the given map data to map.json
export async function writeMap(newData: MapData): Promise<void> {
    try {
        // Ensure the data to be written conforms to the schema
        MapSchema.parse(newData);
        const dataString = JSON.stringify(newData, null, 2); // Pretty-print JSON
        await fs.writeFile(memoryFilePath, dataString, 'utf-8');
    } catch (error) {
        logger.error("Error validating or writing memory file:", error);
        throw new Error(`Failed to validate/write memory file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Validates and writes the given map data to map.json
export async function writeCell(location: LocationData, status: TileType): Promise<void> {
    try {
        const currentMap = await readMap()
        currentMap.tiles[location.x-1][location.y-1] = status
        // Ensure the data to be written conforms to the schema
        const dataString = JSON.stringify(currentMap, null, 2); // Pretty-print JSON
        await fs.writeFile(memoryFilePath, dataString, 'utf-8');
    } catch (error) {
        logger.error("Error validating or writing memory file:", error);
        throw new Error(`Failed to validate/write memory file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function registerMapResource(server: McpServer): void {
    logger.debug("Registering Raibot Knowledge Map resource...");

    
    server.resource(
        "Raibot Map",
        "memory://raibot_map",
        async (uri) => {
            const MapData = await readMap()
            return {
                contents: [{
                    uri: uri.toString(),
                    mimeType: "application/json",
                    text: JSON.stringify(MapData, null, 2)
                }]
            }
        }
    )
    logger.debug("Raibot Knowledge Map resource registered");
}
