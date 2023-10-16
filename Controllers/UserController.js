const User = require("../Models/UserModel");
const { client } = require("../RedisConnection");

//For user to get my details
exports.MyDetails = async (req, res) => {
	const userId = req.user._id;
	try {
		const MyDetails = await User.findById(userId).select("name email");
		if (!MyDetails) return res.status(404).json({ result: "fail", message: "User not found" });

		res.status(200).json({ result: "pass", MyDetails });
	} catch (err) {
		res.status(500).json({ result: "fail", message: "Something went wrong" });
	}
};

exports.UpdateMe = async (req, res, next) => {
	try {
		//destructuring insensitive data
		const { name, email } = req.body;

		//findig the user in DB
		const MeUser = await User.findById(req.user._id);
		if (!MeUser) return res.status(404).json({ result: "fail", err: "User not found" });

		//Updating User details
		if (first_name) MeUser.name = name;
		if (email) MeUser.email = email;

		//deleting the cache memory -- important before save
		await client.del(`user:${MeUser._id}`); //necessary for further AuthCheck
		//saving
		await MeUser.save();

		res.status(200).json({ result: "pass", mesasge: "User details updated", MeUser });
	} catch (err) {
		res.status(500).json({ result: "fail", err: "Something went wrong while updating your details" });
	}
};
//for user to delete it's account
exports.DeleteMyAccount = async (req, res, next) => {
	try {
		//finding the user in DB
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ result: "fail", err: "user not found" });
		//making the user's active:false
		user.active = false;
		//saving it to the DB
		await user.save();

		//deleting the JWT token from cookie
		res.clearCookie("jwt");

		//deleting the cache memory
		try {
			await client.del("user._id");
		} catch (err) {
			if (process.env.NODE_ENV === "development") console.error(err);
		}

		res.status(200).json({ result: "pass", message: "user deleted" });
	} catch (err) {
		res.status(500).json({ result: "fail", err: "Something went wrong while deleting your details" });
	}
};
//for user to logout
exports.LogOut = async (req, res, next) => {
	try {
		//clearing cookie
		res.cookie("jwt", "", {
			expires: new Date(Date.now() - 10 * 1000), // Set it in the past to ensure deletion
			httpOnly: true,
			sameSite: "none",
			secure: true,
		});
		//deleting the cached memory
		try {
			const user = req.user;
			await client.del(`user:${user._id}`);
		} catch (err) {
			if (process.env.NODE_ENV === "development") console.error(err);
		}
		res.status(200).json({ result: "pass", message: "Logout Successful" });
	} catch (err) {
		res.status(500).json({ result: "fail", err });
	}
};
//for admin to fetch all user details
exports.GetAllUsers = async (req, res, next) => {
	try {
		//finding all Users
		const Users = await User.find({ active: true }).select("-passwordChangedAt -__v");

		//total user count
		const count = Users.length;
		//response
		res.status(200).json({ result: "pass", count, Users });
	} catch (err) {
		//error response
		res.status(400).json({ result: "fail", err });
	}
};
//for admin to create a user
exports.CreateNewUser = async (req, res, next) => {
	try {
		//destructuring req.body
		const { name, email, password } = req.body;

		//creating new user mongoose instance and saving it
		let NewUser = new User({ name, email, password });
		await NewUser.save();

		//deleting sensitive fields
		const DeletedVal = ["__v", "password", "role"];
		DeletedVal.forEach((el) => {
			NewUser[el] = undefined;
		});

		//response
		res.status(201).json({ result: "pass", NewUser });
	} catch (err) {
		//error response
		res.status(400).json({ result: "fail", err });
	}
};
//for admin to get one user details
exports.GetOneUser = async (req, res, next) => {
	try {
		//finding by id
		const id = req.params.id;
		const query = User.findById(id).select("-__v");
		const user = await query;

		//if user not found
		if (!user) return res.status(404).json({ result: "fail", err: "User is not found" });
		//response
		res.status(200).json({ result: "pass", user });
	} catch (err) {
		//error response
		res.status(400).json({ result: "fail", err });
	}
};
//for admin to update a user details
exports.UpdateUser = async (req, res, next) => {
	try {
		//destructuring the req.body
		const { name, email } = req.body;

		//finding by id
		const id = req.params.id;
		let UpdatedUser = await User.findById(id).select("-__v");

		//if user not found
		if (!UpdatedUser) return res.status(404).json({ result: "fail", err: "user not found" });

		//updating selected fields for security
		if (last_name) UpdatedUser.name = name;
		if (email) UpdatedUser.email = email;

		//deleting the cache memory -- important to do before save
		await client.del(`user:${id}`); //necessary for further AuthCheck
		//saving
		await UpdatedUser.save();

		//response
		res.status(200).json({ result: "pass", message: "User updated", UpdatedUser });
	} catch (err) {
		//error response
		res.status(400).json({ result: "fail", err: "Something went wrong while updating the user" });
	}
};
//for admin to delete a user details
exports.DeleteUser = async (req, res, next) => {
	try {
		//finding by id
		const id = req.params.id;
		const DeletedUser = await User.findByIdAndDelete(id);
		//if user not found
		if (!DeletedUser) return res.status(404).json({ result: "fail", err: "user not found" });
		//response
		res.status(200).json({ result: "pass", DeletedUser });
	} catch (err) {
		//error response
		res.status(400).json({ result: "fail", err });
	}
};

//for checking the cache
exports.checkcache = async (req, res, next) => {
	try {
		const keys = await client.keys("*");
		let values = keys.map(async (e) => {
			let val = await client.get(e);
			return JSON.parse(val);
		});

		values = await Promise.all(values);
		res.json({ values });
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.error(err);
	}
	// await client.flushDb();
};
