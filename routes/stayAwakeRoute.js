const router = require('express').Router();

router.get('/', (req, res) => {
  console.log("i'm awake");
  res.send('stay awake');
});

module.exports = router;
