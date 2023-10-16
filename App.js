const express = require("express");
const UserRouter = require("./Routes/UserRouter");
const ProductRouter = require("./Routes/ProductRouter");
const SecurityMiddleware = require("./Routes/SecurityMiddlewareRouter");
const ReviewRouter = require("./Routes/ReviewRouter");
const CartRouter = require("./Routes/CartRouter");
const OrderRouter = require("./Routes/OrderRotuer");
const cors = require("cors");
const PaymentRouter = require("./Routes/PaymentRouter");

const app = express();
const api = process.env.API;

app.use(
	cors({
		origin: process.env.FRONTEND_ORIGIN,
		credentials: true,
	})
);

app.use(express.json());

//security middleware
app.use(SecurityMiddleware);

app.get("/", (req, res) => {
	res.json({ ok });
});

//path middlewares
app.use(`/${api}/users`, UserRouter);
app.use(`/${api}/products`, ProductRouter);
app.use(`/${api}/reviews`, ReviewRouter);
app.use(`/${api}/cart`, CartRouter);
app.use(`/${api}/checkout`, PaymentRouter);
app.use(`/${api}/orders`, OrderRouter);

module.exports = app;
