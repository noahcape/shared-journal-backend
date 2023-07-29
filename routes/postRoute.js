const router = require("express").Router();
const aws = require("aws-sdk");
const mongoose = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const auth = require("../middleware/auth");
const upload = require("../middleware/image-handler");

const multipleUpload = upload.array("image");

const s3 = new aws.S3();

mongoose.set("useFindAndModify", false);

// post new
router.post("/new", auth, multipleUpload, async (req, res) => {
  // unpack post body
  const { text, date, month, year } = req.body;
  const images = [];
  const image_keys = [];

  if (req.files) {
    for (let i = 0; i < req.files.length; i++) {
      images.push(req.files[i].location);
      image_keys.push(req.files[i].key);
    }
  }

  // construct new post
  const newPost = new Post({
    text,
    images: req.files && images,
    image_keys: req.files && image_keys,
    date,
    month,
    year,
    user: req.user,
  });

  // save post
  try {
    const savedPost = await newPost.save().catch((err) => {
      console.error(err);
    });
    res.json(savedPost);
  } catch (err) {
    console.error(err);
  }
});

// edit date of post
router.put("/edit_date", auth, async (req, res) => {
  const { dateTime, postId } = req.body;

  const post = await Post.findOne({ _id: postId, user: req.user }).catch(
    (err) => {
      console.log(err);
    }
  );

  if (!post) {
    return res.json({ msg: "No post with that id with that user" }).end();
  }

  const date = new Date(dateTime);

  const month = date.getMonth();
  const year = date.getFullYear();

  await Post.findOneAndUpdate(
    { _id: postId, user: req.user },
    { $set: { date, month, year } }
  ).catch((err) => {
    console.log(err);
  });
  const editedPost = await Post.findOne({ _id: postId, user: req.user });

  return res.json(editedPost).end();
});

// get all in most recent order
router.get("/", auth, async (req, res) => {
  const posts = await Post.find({ user: req.user })
    .sort({ date: -1 })
    .catch((err) => {
      console.error(err);
    });
  res.json(posts);
});

// get posts by date and month
router.get("/byDate", auth, async (req, res) => {
  const posts = await Post.find({
    user: req.user,
    month: req.query.month,
    year: req.query.year,
  })
    .sort({ date: -1 })
    .catch((err) => {
      console.error(err);
    });

  res.json(posts);
});

// get date options to choose from
router.get("/getDateOptions", auth, async (req, res) => {
  const posts = await Post.find({ user: req.user }).catch((err) => {
    console.error(err);
  });

  const options = {};

  posts.map((post) => {
    options[post.year] = [];
  });

  posts.map((post) => {
    if (!options[post.year].includes(post.month)) {
      options[post.year].push(post.month);
    }
  });

  res.json(options);
});

// get by id
router.get("/getById", auth, async (req, res) => {
  const post = await Post.findById(req.query.id).catch((err) => {
    console.error(err);
  });
  res.json(post);
});

// delete photo
router.delete("/deleteImage", auth, async (req, res) => {
  const post = await Post.findById(req.body.id).catch((err) => {
    console.error(err);
  });

  const imageKeys = [];
  const images = [];

  post.image_keys.forEach((key) => {
    if (!req.body.keys.includes(key)) {
      imageKeys.push(key);
    }
  });

  post.images.forEach((image) => {
    if (!req.body.images.includes(image)) {
      images.push(image);
    }
  });

  post.images = images;
  post.image_keys = imageKeys;

  await Post.replaceOne({ _id: post._id }, post).catch((err) => {
    console.error(err);
  });

  req.body.keys.map(async (key) => {
    await s3.deleteObject(
      {
        Bucket: "shared-journal",
        Key: key,
      },
      (err) => {
        err && console.log(err);
      }
    );
  });

  res.send("done").end();
});

// delete by id in query
router.delete("/:id", auth, async (req, res) => {
  await Post.findOne({ user: req.user, _id: req.query.id }).then(
    async (post) => {
      post.image_keys.forEach(async (key) => {
        await s3.deleteObject(
          {
            Bucket: "shared-journal",
            Key: key,
          },
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );
      });
      await Post.findByIdAndDelete({ _id: req.query.id }).catch((err) => {
        console.error(err);
      });
    }
  );

  res.json("done").end();
});

// edit text by id
router.put("/edit", auth, async (req, res) => {
  await Post.findByIdAndUpdate(
    { _id: req.query.id },
    { text: req.query.text }
  ).catch((err) => {
    console.error(err);
  });
  res.send("edited");
});

// get all post or just for certain dates
router.get("/getBy", auth, async (req, res) => {
  let posts = [];
  if (
    (!req.query.month && !req.query.year) ||
    (!req.query.year && req.query.month)
  ) {
    posts = await Post.find({ user: req.user })
      .sort({ date: -1 })
      .catch((err) => {
        console.error(err);
      });
  } else if (!req.query.month && req.query.year) {
    posts = await Post.find({ user: req.user, year: req.query.year })
      .sort({ date: -1 })
      .catch((err) => {
        console.error(err);
      });
  } else {
    posts = await Post.find({
      user: req.user,
      year: req.query.year,
      month: req.query.month,
    })
      .sort({ date: -1 })
      .catch((err) => {
        console.error(err);
      });
  }

  res.json(posts);
});

// get user id from journal name in header
router.get("/public_get", async (req, res) => {
  const displayNameArray = req.query.journal_name.split("_");

  let displayName = "";

  displayNameArray.map((name) => {
    displayName += `${name} `;
  });

  const user = await User.findOne({ displayName: displayName.trim() }).catch(
    (err) => {
      console.error(err);
    }
  );

  const userID = user._id;

  if (!user) {
    return res.status(500).json({ error: "cannot find user" });
  }

  let posts = [];
  if (
    (!req.query.month && !req.query.year) ||
    (!req.query.year && req.query.month)
  ) {
    posts = await Post.find({ user: userID })
      .sort({ date: 1 })
      .catch((err) => {
        console.error(err);
      });
  } else if (!req.query.month && req.query.year) {
    posts = await Post.find({ user: userID, year: req.query.year })
      .sort({ date: 1 })
      .catch((err) => {
        console.error(err);
      });
  } else {
    posts = await Post.find({
      user: userID,
      year: req.query.year,
      month: req.query.month,
    })
      .sort({ date: 1 })
      .catch((err) => {
        console.error(err);
      });
  }

  res.json(posts);
});

// get date options to choose from PUBLIC
router.get("/public_getDateOptions", async (req, res) => {
  const displayNameArray = req.query.journal_name.split("_");

  let displayName = "";

  displayNameArray.map((name) => {
    displayName += `${name} `;
  });

  const user = await User.findOne({ displayName: displayName.trim() }).catch(
    (err) => {
      console.error(err);
    }
  );

  const userID = user._id;

  if (!user) {
    return res.status(500).json({ error: "cannot find user" });
  }

  const posts = await Post.find({ user: userID }).catch((err) => {
    console.error(err);
  });

  const options = {};

  posts.map((post) => {
    options[post.year] = [];
  });

  posts.map((post) => {
    if (!options[post.year].includes(post.month)) {
      options[post.year].push(post.month);
    }
  });

  res.json(options);
});

module.exports = router;
