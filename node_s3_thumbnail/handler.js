"use strict";

const AWS = require("aws-sdk");
const util = require("util");
const sharp = require("sharp");

const s3 = new AWS.S3();

const sourceBucket = process.env.SOURCE_BUCKET;
const destinationBucket = process.env.DESTINATION_BUCKET;
const sizes = {
  width: Number(process.env.SIZES),
  height: Number(process.env.SIZES),
};

module.exports.thumbGenerator = async (event) => {
  const record = event.Records[0].s3;
  const key = record.object.key;

  const img = await getS3Image(key);
  const imgResized = await resizeImage(img);
  const url = await uploadToS3(imgResized, key);

  return url;
};

function getS3Image(keybkt) {
  const result = s3.getObject({ Bucket: sourceBucket, Key: keybkt }).promise();

  return result;
}

function resizeImage(data) {
  const result = sharp(data.Body)
    .resize(sizes.width, sizes.height)
    .toFormat("png")
    .toBuffer();

  return result;
}

function uploadToS3(buffer, keybkt) {
  const params = {
    Key: String(keybkt),
    ACL: "public-read",
    Bucket: destinationBucket,
    Body: buffer,
    ContentType: "image/png",
  };

  const result = s3.putObject(params).promise();

  return result;
}
