import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import logger from "../logger.js"
import { z } from "zod"
import { LocationData, readLocation, writeLocation, X, xSchema, ySchema } from "../resources/raibotLocationResource.js"
import { createEmptyMap, writeCell } from "../resources/mapResource.js"
import { appendToHistory, EventData } from "../resources/raibotHistoryResource.js"

const GRID = 
  "++X++" + // row 1 (this is classed as the lowest row, ie you cannot move down from here)
  "+++++" + // row 2
  "+++++" + // row 3
  "+++++" + // row 4
  "+++++"   // row 5
// ABCDE

// Define the expected input structure for this tool using Zod
const instructionInputShape = {
    direction: z.enum(['start', 'left', 'right', 'up', 'down']).describe("The instructions the robot is to carry out"),
    startX: xSchema,
    startY: ySchema
}

const instructionInputShapeSchema = z.object(instructionInputShape)  
type InstructionInput = z.infer<typeof instructionInputShapeSchema>

function move(location: LocationData, deltaX: number, deltaY: number): LocationData {
    
  const newX = location.x ? location.x + deltaX : 0
  const newY = location.y ? location.y + deltaY : 0

  if (newX < 1) {
    throw(new Error("Cannot move left, already at the left edge"))
  }
  if (newX > 5) {
    throw(new Error("Cannot move right, already at the right edge"))
  }
  if (newY < 1) {
    throw(new Error("Cannot move down, already at the bottom edge"))
  }
  if (newY > 5) {
    throw(new Error("Cannot move up, already at the top edge"))
  }
  const newLocation: LocationData = { x: newX, y: newY }
  return newLocation
}

export default function registerSimulatorTool(server: McpServer) {
  logger.debug("Registering Raibot simulator tool...")
  server.tool(
      "raibot_simulator",
      "A tool that allows a simulated Raibot to be controlled.",
      instructionInputShape,
      async (args: InstructionInput) => {
        logger.debug("Raibot triggered...with instruction: " + JSON.stringify(args))

        const event: EventData = {
          fromX: 0,
          fromY: 0,
          toX: 0,
          toY: 0,
          instruction: args.direction,
          result: ""
        }

        if (args.direction === 'start') {
          if (args.startX === undefined || args.startY === undefined) {
            event.result = "startX and startY must be provided when direction is 'start'"
            await appendToHistory(event)
            throw new Error("startX and startY must be provided when direction is 'start'")
          }
          logger.info(`Raibot starting at column: ${args.startX} row: ${args.startY}`)
          
          event.fromX = args.startX
          event.fromY = args.startY
          event.toX = args.startX
          event.toY = args.startY
          event.result = "OK"
          await appendToHistory(event)

          await writeLocation({x: args.startX, y: args.startY})
          await createEmptyMap()
          writeCell({x: args.startX, y: args.startY}, ' ')
        } else {
          let location: LocationData = await readLocation()
          event.fromX = location.x
          event.fromY = location.y

          try {
            switch (args.direction) {
              case 'left':
                logger.debug("Raibot moving left")
                location = move(location, -1, 0)
                break
              case 'right':
                logger.debug("Raibot moving right")
                location = move(location, 1, 0)
                break
              case 'up':
                logger.debug("Raibot moving up")
                location = move(location, 0, 1)
                break
              case 'down':
                logger.debug("Raibot moving down")
                location = move(location, 0, -1)
                break
              default:
                event.toX = location.x
                event.toY = location.y
                event.result = "Unknown instruction: " + args.direction
                await appendToHistory(event)

                logger.error("Unknown instruction:", args.direction)
                throw new Error(`Unknown instruction: ${args.direction}`)
            }
            event.toX = location.x
            event.toY = location.y
            if (location.x && location.y) {
              if (GRID[location.y * 5 + location.x - 6] !== '+') {
                await writeCell(location, 'X')

                event.result = "Cannot move here, there is an obstacle"
                await appendToHistory(event)

                throw new Error("Cannot move here, there is an obstacle")
              }
            }
            event.result = "Ok"
            await appendToHistory(event)

            await writeLocation(location)
            await writeCell(location, ' ')
          } catch (error) {
            event.toX = location.x
            event.toY = location.y
            event.result = "Error moving Raibot: " + error
            await appendToHistory(event)

            logger.error("Error moving Raibot:", error)
            throw new Error(`Error moving Raibot: ${error instanceof Error ? error.message : String(error)}`)
          }
        }

        return {
          content: [{
              type: "text",
              text: `Raibot is moving ${args.direction}.`
          }]
      }
  })
}