const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const MongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const router = express.Router();

//security middlewares
router.use(helmet()); // for setting security headers

router.use(MongoSanitize()); // to save no-SQL query attack
router.use(xss()); // to protect from cross-site-scripting


//for parsing the cookies into object
router.use(cookieParser());

module.exports = router;