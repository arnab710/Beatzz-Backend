const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

const dbConnection = require("./DatabaseConnection");
const app = require("./App");
const { RedisServer } = require("./RedisConnection");

const server = () => {
	try {
		//database connecting
		dbConnection();
		//redis Server conecting
		RedisServer();

		const port = process.env.PORT || 8000;
		//listening to port
		app.listen(port, () => {
			if (process.env.NODE_ENV === "development") console.log("listening");
		});
	} catch (err) {
		process.exit(1);
	}
};
//initializing all servers
server();
