# raibot-mcp-server
This project builds a demonstration MCP server that includes tools for controlling a Raibot (an AI controlled robot)

There is a full description in my [Medium article](https://medium.com/@martin.hodges/learning-about-agentic-solutions-using-llms-agents-mcp-servers-and-a-raibot-to-add-to-the-fun-8942edccac07).

# MCP Server Capabilities
This MCP server provides the following capabilities:

## Resources
* `Raibot Map` - Raibot's internal map
* `Raibot Location` - The current location of the Raibot
* `Raibot History` - A history of instructions given to the Raibot and the results of those instructions

## Prompts
* `Raibot` - Setting a context for the Raibot

## Tools
* `hello_world` - A greeting from Raibot
* `raibot_simulator` - A robot simulator
* `raibot_location` - The current location of the Raibot

# building and running
To build this project it is recommended to use node v22.

It is a standard node / Typescript project, first install the dependencies with:
```
npm install
```

You can build and run the project with:
```
npm run build
node build/index.js
```

However, for development it is better to use:
```
npm run dev
```
This will run the server and monitor the project folder. Any change will trigger a new build and a restart of the server.

# testing

To test the server, you can run an MCP inspector. Once you run your server, you can then test it with:
```
DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector
```
This will open a web application on <http://localhost:6274> that allows you to connect to the server using Streamable HTTP at http://localhost:3001/mcp (not the /sse default).

When the server restarts due to a change, it is best to reload the web page and reconnect.

# Alternative connection method
The server as it stands will start an HTTP server using Express. It will then allow clients to connect to it over a Streamable HTTP connection.

There is an alternative connection option over `stdio`. If you want to use this alternative, simply replace `src/index.ts` with the `src/index-stdio.ts` file. Then rebuild with:
```
npm run build
```

To test against this version, the inspector and server must be run in the same process space. This can be acheived with:
```
DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector node build/index.js
```
Running this way will not automatically rebuild and rerun the server when you make a change. Whilst this works for the inspector client, you would need to adjust your agent to run the client in the same process space. also, `console.log` statements will not work as they will print to the `stdio` stream. You can try `console.error` statements that use the `stderr` stream which the inspector should redirect to the terminal, however, I have not had success with this.

***It is recommended that you stick to the Streamable HTTP solution.***

# Logs
To overcome the logging problem, I have included a `winston` logging implementation that logs to files under the `./logs` folder. This logs in JSON.

# Data
To implement persistent storage for the MCP resources, I have used files. These can be found in the `./data` folder. These can be deleted at anytime as they should be recreated when the resources are updated.


