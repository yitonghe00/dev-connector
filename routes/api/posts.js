const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load validation
const validatePostInput = require("../../validation/Post");

// Load Post model
const Post = require("../../models/Post");
// Load Profile model
const Profile = require("../../models/Profile");

// @route  GET api/posts/test
// @desc   Tests posts route
// @access Public
router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

// @route  GET api/posts
// @desc   Get Posts
// @access Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: "No posts found." }));
});

// @route  GET api/posts/:id
// @desc   Get Posts by id
// @access Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ nopostfound: "No post found with that id." })
    );
});

// @route  POST api/posts
// @desc   Create Posts
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar, // Pull the avatar of the user in React and store the state in Redux
      user: req.user._id
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route  DELETE api/posts/:id
// @desc   Delete the Post
// @access Private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findOne({ _id: req.params.id })
        .then(post => {
          // Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: "User not authorized." });
          }

          // Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ nopostfound: "No post found." }));
    });
  }
);

module.exports = router;
