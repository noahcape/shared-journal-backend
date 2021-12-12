const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/userModel")
require('dotenv').config();

module.exports = class UserController {
  async registerUser(req, res) {
    try {
      const {
        email, password, passwordCheck, displayName
      } = req.body;

      // validation
      if (!email || !password || !passwordCheck || !displayName) return res.status(400).json({ msg: 'Not all fields have been entered' });

      if (password.length < 5) return res.status(400).json({ msg: 'Password needs to be at least 5 character long' });

      if (password !== passwordCheck) return res.status(400).json({ msg: 'Enter the same password twice for verification' });

      if (await User.findOne({ displayName })) { return res.status(400).json({ msg: 'Sorry, that name is already taken' }); }

      if (await User.findOne({ email })) { return res.status(400).json({ msg: 'Account with this email already exists' }); }

      const salt = await bcrypt.genSalt();
      const paswordHash = await bcrypt.hash(password, salt);

      const newUser = User({
        email,
        password: paswordHash,
        displayName,
      });

      await newUser.save();
      res.json({ displayName });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      // validate
      if (!email || !password) return res.status(400).json({ msg: 'Not all fields have been entered' });

      const user = await User.findOne({ email });

      if (!user) return res.status(400).json({ msg: 'No account with this email has been registered' });

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id }, process.env.JWT_PASSWORD);

      res.json({
        token,
        user: {
          id: user._id,
          journalName: user.displayName,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const deletedUser = await User.findByIdAndDelete(req.user);
      res.json(deletedUser);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async isTokenValid(req, res) {
    try {
      const token = req.header('x-auth-token');

      if (!token) return res.json(false);

      const verified = jwt.verify(token, process.env.JWT_PASSWORD);

      if (!verified) return res.json(false);

      const user = await User.findById(verified.id);

      if (!user) return res.json(false);

      return res.json(true);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getUser(req, res) {
    const user = await User.findById(req.user);
    res.json({ journalName: user.displayName, id: user._id });
  }

  async downloadJournal(req, res) {
    const { user } = req

    if (!await User.findById(user)) { return res.status(400).json({ msg: 'No user with that is could be found in our system' }).end(); }

    res.status(200).download('/Users/noahcape/Desktop/Personal Projects/shared-journal-backend/email.html', 'journal.html', (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Sent');
      }
    }
    )
  }
};
