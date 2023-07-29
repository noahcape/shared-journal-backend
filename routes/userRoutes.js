const UserRouter = require("express").Router();
const auth = require("../middleware/auth");
const UserController = require("../controllers/userController");

const UsersController = new UserController();

// GET
UserRouter.get("/api/users/", auth, UsersController.getUser);
UserRouter.get(
  "/api/users/download_journal",
  auth,
  UsersController.downloadJournal
);

// POST
UserRouter.post("/api/users/register", UsersController.registerUser);
UserRouter.post("/api/users/login", UsersController.loginUser);
UserRouter.post("/api/users/isTokenValid", UsersController.isTokenValid);

// DELETE
UserRouter.delete("/api/users/delete", auth, UsersController.deleteUser);

module.exports = UserRouter;
