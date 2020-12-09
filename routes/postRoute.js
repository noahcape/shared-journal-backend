const router = require("express").Router();
const aws = require('aws-sdk');
const mongoose = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/userModel")
const auth = require("../middleware/auth")
const upload = require("../middleware/image-handler");

const multipleUpload = upload.array("image")

const s3 = new aws.S3()

mongoose.set('useFindAndModify', false)

// post new 
router.post("/new", auth, multipleUpload, async (req, res) => {

    // unpack post body
    const { text, date, month, year } = req.body;
    const images = []
    const image_keys = []

    if (req.files) {

        for (let i = 0; i < req.files.length; i++) {
            images.push(req.files[i].location)
            image_keys.push(req.files[i].key)
        }
    }

    console.log(images, image_keys)

    // construct new post
    const newPost = new Post({
        text,
        images: req.files && images,
        image_keys: req.files && image_keys,
        date,
        month,
        year,
        user: req.user
    })

    // save post
    try {
        const savedPost = await newPost.save().catch(err => { console.error(err) });
        res.json(savedPost);
    } catch (err) {
        console.error(err);
    }
})

// get all in most recent order
router.get("/", auth, async (req, res) => {
    const posts = await Post.find({ user: req.user }).sort({ _id: -1 }).catch(err => { console.error(err) });
    res.json(posts)
})

// get posts by date and month
router.get("/byDate", auth, async (req, res) => {
    const posts = await Post.find({ user: req.user, month: req.query.month, year: req.query.year }).sort({ _id: -1 }).catch(err => { console.error(err) });

    res.json(posts)
})

// get date options to choose from
router.get("/getDateOptions", auth, async (req, res) => {
    const posts = await Post.find({ user: req.user }).catch(err => { console.error(err) })

    const options = {}

    posts.map(post => {
        options[post.year] = []
    })

    posts.map(post => {
        if (!options[post.year].includes(post.month)) {
            options[post.year].push(post.month)
        }
    })

    res.json(options)
})

// get by id
router.get("/getById", auth, async (req, res) => {
    const post = await Post.findById(req.query.id).catch(err => { console.error(err) });
    res.json(post);
})

// delete photo 
router.delete("/deleteImage", auth, async (req, res) => {
    const post = await Post.findById(req.body.id).catch(err => { console.error(err) })

    const imageKeys = []
    const images = []

    post.image_keys.forEach(key => {
        if (!req.body.keys.includes(key)) {
            imageKeys.push(key)
        }
    })

    post.images.forEach(image => {
        if (!req.body.images.includes(image)) {
            images.push(image)
        }
    })

    post.images = images
    post.image_keys = imageKeys

    await Post.replaceOne({ _id: post._id }, post).catch(err => { console.error(err) })

    await s3.deleteObject({
        Bucket: "shared-journal",
        Key: (req.body.key)
    }, function (err) {
        err && res.json({ error: err.message })
    })
})

// delete by id in query
router.delete("/:id", auth, async (req, res) => {
    console.log("delete")
    const post = await Post.findById(req.params.id)

    post.image_keys.forEach(async key => {
        await s3.deleteObject({
            Bucket: "shared-journal",
            Key: key
        }, function (err) {
            if (err) {
                return res.json({ error: err.message }).end()
            } 
        }).then(async () => await Post.findByIdAndDelete({ _id: req.params.id }).catch(err => { console.error(err) }).then(() => console.log("deleted")))
    })
    
})

// edit text by id
router.put("/edit", auth, async (req, res) => {
    await Post.findByIdAndUpdate({ _id: req.query.id }, { text: req.query.text }).catch(err => { console.error(err) });
    res.send("edited")
})

// get all post or just for certain dates
router.get("/getBy", auth, async (req, res) => {
    let posts = []
    if ((!req.query.month && !req.query.year) || (!req.query.year && req.query.month)) {
        posts = await Post.find({user: req.user}).sort({ _id: -1 }).catch(err => {console.error(err)})
    } else if (!req.query.month && req.query.year) {
        posts = await Post.find({user: req.user, year: req.query.year}).sort({ _id: -1 }).catch(err => {console.error(err)})
    } else {
        posts = await Post.find({user: req.user, year: req.query.year, month: req.query.month}).sort({ _id: -1 }).catch(err => {console.error(err)})
    }

    res.json(posts)
})

// public routes for visitors

// get user id from journal name in header
router.get("/public_get", async (req, res) => {
    let displayNameArray = req.query.journal_name.split("_");

    let displayName = ""

    displayNameArray.map(name => {
        displayName += name + " "
    })

    const user = await User.findOne({ "displayName": displayName.trim() }).catch(err => { console.error(err) })

    const userID = user._id

    let posts = []
    if ((!req.query.month && !req.query.year) || (!req.query.year && req.query.month)) {
        posts = await Post.find({user: userID}).sort({ _id: -1 }).catch(err => {console.error(err)})
    } else if (!req.query.month && req.query.year) {
        posts = await Post.find({user: userID, year: req.query.year}).sort({ _id: -1 }).catch(err => {console.error(err)})
    } else {
        posts = await Post.find({user: userID, year: req.query.year, month: req.query.month}).sort({ _id: -1 }).catch(err => {console.error(err)})
    }

    res.json(posts)
})

// get date options to choose from PUBLIC
router.get("/public_getDateOptions", async (req, res) => {
    let displayNameArray = req.query.journal_name.split("_");

    let displayName = ""

    displayNameArray.map(name => {
        displayName += name + " "
    })

    const user = await User.findOne({ "displayName": displayName.trim() }).catch(err => { console.error(err) })

    const userID = user._id

    const posts = await Post.find({ user: userID}).catch(err => { console.error(err) })

    const options = {}

    posts.map(post => {
        options[post.year] = []
    })

    posts.map(post => {
        if (!options[post.year].includes(post.month)) {
            options[post.year].push(post.month)
        }
    })

    res.json(options)
})

module.exports = router;