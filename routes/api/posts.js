const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Post model
const Post = require("../../models/Post");

// @route  GET api/posts/test
// @desc   Tests posts route
// @access Public
router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

module.exports = router;
