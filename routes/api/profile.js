const express = require("express");
const router = express.Router();
const mogoose = require("mongoose");
const passport = require("passport");

// Load Profile model
const Profile = require("../../models/Profile");
// Load User model
const User = require("../../models/User");

// @route  GET api/profile/test
// @desc   Tests profile route
// @access Public
router.get("/test", (req, res) => res.json({ msg: "Profile works" }));

module.exports = router;
