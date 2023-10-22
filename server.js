const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

const cluster = require("node:cluster");
const numCPUs = require("node:os").availableParallelism();
const process = require("node:process");
const dbConnection = require("./DatabaseConnection");
const app = require("./App");
const { RedisServer } = require("./RedisConnection");

const server = () => {
	try {
		//database connecting
		dbConnection();
		//redis Server conecting
		RedisServer();

		if (cluster.isPrimary) {
			// Fork workers.
			for (let i = 0; i < numCPUs; i++) {
				cluster.fork();
			}

			cluster.on("exit", (worker, code, signal) => {
				cluster.fork();
			});
		} else {
			const port = process.env.PORT || 8000;
			const serverMain = app.listen(port, () => {
				if (process.env.NODE_ENV === "development") console.log("listening");
			});
		}
	} catch (err) {
		process.exit(1);
	}
};

//initializing all servers
server();
