const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new aws.S3();

aws.config.update(
    {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        region: 'us-west-2',
    },
    (err) => {
        if (err) console.log(err);

        console.log('AWS s3 set up');
    },
);

const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'shared-journal',
    acl: 'public-read',
    metadata(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key(req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

module.exports = upload;
