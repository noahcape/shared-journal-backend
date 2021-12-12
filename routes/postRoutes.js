const PostRouter = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/image-handler');

const multipleUpload = upload.array('image');
const PostsController = require('../controllers/postController');

const PostContoller = new PostsController();

// GET
PostRouter.get('/api/posts/', auth, PostContoller.getPosts);
PostRouter.get('/api/posts/public_get', PostContoller.publicGet);

// POST
PostRouter.post('/api/posts/new', auth, multipleUpload, PostContoller.newPost);

// EDIT
PostRouter.put(
  '/api/posts/edit_post',
  auth,
  multipleUpload,
  PostContoller.editPost,
);
PostRouter.put('/api/posts/like_post', PostContoller.likePost);

// DELETE
PostRouter.delete('/api/posts/delete_post', auth, PostContoller.deletePost);

module.exports = PostRouter;
