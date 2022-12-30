/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const aws = require('aws-sdk');
const Post = require('../models/postModel');
const User = require('../models/userModel');

const s3 = new aws.S3();
mongoose.set('useFindAndModify', false);

module.exports = class PostsController {
  async newPost(req, res) {
    const {
      text, date, month, year,
    } = req.body;
    const images = [];
    const image_keys = [];

    if (req.files) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].location);
        image_keys.push(req.files[i].key);
      }
    }
    const newPost = new Post({
      text,
      images: req.files && images,
      image_keys: req.files && image_keys,
      date,
      month,
      year,
      user: req.user,
      likes: [],
    });

    try {
      const savedPost = await newPost.save().catch((err) => {
        console.error(err);
      });
      res.json(savedPost);
    } catch (err) {
      console.error(err);
    }
  }

  async getPosts(req, res) {
    const posts = await Post.find({ user: req.user })
      .sort({ date: -1 })
      .catch((err) => {
        console.error(err);
      });
    res.json(posts);
  }

  async publicGet(req, res) {
    let displayName = '';
    req.query.journal_name.split('_').map((name) => {
      displayName += `${name} `;
    });

    const user = await User.findOne({ displayName: displayName.trim() }).catch(
      (err) => {
        console.error(err);
      },
    );
    console.log(req.query);
    console.log(displayName);
    console.log(user);
    const userID = user._id;

    const posts = await Post.find({ user: userID })
      .sort({ date: 1 })
      .catch((err) => {
        console.error(err);
      });

    res.json(posts);
  }

  async likePost(req, res) {
    const { id, message } = req.body;
    const post = await Post.findOne({ _id: id });
    let { likes } = post;
    if (!likes) {
      likes = [message];
    } else {
      likes.push(message);
    }

    if (!post) {
      return res
        .status(400)
        .json({ msg: 'Sorry, something went from on our end.' });
    }

    await Post.updateOne({ _id: id }, { $set: { likes } }).catch((err) => {
      console.error(err);
    });
    const editedPost = await Post.findOne({ _id: id });

    return res.json(editedPost).end();
  }

  async deletePost(req, res) {
    Post.findOne({ user: req.user, _id: req.query.id }).then(async (post) => {
      post.image_keys
        && post.image_keys.forEach(async (key) => {
          await s3.deleteObject(
            {
              Bucket: 'shared-journal',
              Key: key,
            },
            (err, data) => {
              if (err) {
                console.log(err);
              }
            },
          );
        });
      await Post.findByIdAndDelete({ _id: req.query.id }).catch((err) => {
        console.error(err);
      });
    });

    res.json(req.query.id);
  }

  async editPost(req, res) {
    const { text, dateTime } = req.body;
    const keysToDelete = req.body.keysToDelete.split(',');
    const imagesToDelete = req.body.imagesToDelete.split(',');

    const postToEdit = await Post.findOne({
      user: req.user,
      _id: req.query.id,
    }).catch((err) => {
      console.error(err);
    });

    if (!postToEdit) {
      return res.json({ msg: 'No post with that id with that user' }).end();
    }

    if (keysToDelete[0] !== '' && imagesToDelete[0] !== '') {
      // delete some images
      const imageKeys = [];
      const images = [];

      postToEdit.image_keys.forEach((key) => {
        if (!keysToDelete.includes(key)) {
          imageKeys.push(key);
        }
      });

      postToEdit.images.forEach((image) => {
        if (!imagesToDelete.includes(image)) {
          images.push(image);
        }
      });

      postToEdit.images = images;
      postToEdit.image_keys = imageKeys;

      keysToDelete.map(async (key) => {
        await s3.deleteObject(
          {
            Bucket: 'shared-journal',
            Key: key,
          },
          (err) => {
            err && console.log(err, 'Test');
          },
        );
      });
    }

    if (req.files) {
      const images = [];
      const image_keys = [];

      if (req.files) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].location);
          image_keys.push(req.files[i].key);
        }
      }

      postToEdit.images = postToEdit.images.concat(images);
      postToEdit.image_keys = postToEdit.image_keys.concat(image_keys);
    }

    if (text) {
      // edit text
      postToEdit.text = text;
    }

    if (dateTime) {
      // edit date
      const date = new Date(dateTime);

      if (date.getTimezoneOffset() > 0) {
        date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
      }

      postToEdit.date = date;
      postToEdit.month = date.getMonth();
      postToEdit.year = date.getFullYear();
    }
    // update post
    await Post.replaceOne({ _id: req.query.id }, postToEdit).catch((err) => {
      console.error(err);
    });

    // get updated post
    const updatedPost = await Post.findOne({
      user: req.user,
      _id: req.query.id,
    }).catch((err) => {
      console.error(err);
    });

    res.send(updatedPost).end();
  }
};
