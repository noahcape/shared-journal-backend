const router = require("express").Router();
const getUsers = require("../middleware/queryUsers");
const compileUpdates = require("../middleware/compileUpdates");

router.get("/", (req, res) => {
  console.log("i'm awake");
  res.send("stay awake");
});

// Manual trigger for monthly email send
router.get("/triggerMonthlyEmail", async (req, res) => {
  const { secret } = req.query;

  // Simple auth check - use JWT_PASSWORD as the secret
  if (secret !== process.env.JWT_PASSWORD) {
    return res.status(401).send("Unauthorized");
  }

  console.log("Manual trigger: sending monthly emails");

  try {
    // getUsers is a Promise (not a function), so just await it
    const users = await getUsers;
    const userIds = users.map((user) => user._id);

    compileUpdates(userIds);

    res.send({ result: "Monthly email send triggered", userCount: userIds.length });
  } catch (e) {
    console.error("Error triggering monthly email:", e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
