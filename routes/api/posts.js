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

// @route  POST api/posts/:post_id/like
// @desc   Like the Post
// @access Private
router.post(
  "/:post_id/like",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findOne({ _id: req.params.post_id })
        .then(post => {
          // Check if the user already liked the post
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post." });
          }

          // Add user id to the likes array
          post.likes.unshift({ user: req.user.id });

          // Save to database
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ nopostfound: "No post found." }));
    });
  }
);

// @route  POST api/posts/:post_id/unlike
// @desc   Unlike the Post
// @access Private
router.post(
  "/:post_id/unlike",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findOne({ _id: req.params.post_id })
        .then(post => {
          // Check if the user already liked the post
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "You have not yet liked this post." });
          }

          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of the array
          post.likes.splice(removeIndex, 1);

          // Save to database
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ nopostfound: "No post found." }));
    });
  }
);

// @route  POST api/posts/:post_id/comment
// @desc   Add Comment to the Post
// @access Private
router.post(
  "/:post_id/comment",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    Post.findOne({ _id: req.params.post_id })
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add to comment array
        post.comments.unshift(newComment);

        // Save to database
        post
          .save()
          .then(() => res.json(post))
          .catch(err =>
            res.status(404).json({ nopostfound: "No post found." })
          );
      })
      .catch(err => res.status(404).json({ nopostfound: "No post found." }));
  }
);

// @route  DELETE api/posts/:post_id/comment/:comment_id
// @desc   Remove Comment from the Post
// @access Private
router.delete(
  "/:post_id/comment/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findOne({ _id: req.params.post_id })
      .then(post => {
        // Check to see if the comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotfound: "Comment does not exist." });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice out of the array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ nopostfound: "No post found." }));
  }
);

module.exports = router;
