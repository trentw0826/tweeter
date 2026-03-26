import { test } from "@jest/globals";

import { AWSS3Dao } from "../dist/data-access/DynamoDB/AWSS3Dao.js";

function createDaoWithSend(sendImpl) {
  const dao = new AWSS3Dao();
  dao.client.send = sendImpl;
  return dao;
}

test("AWSS3Dao.getFileUrl uses bucket and key", async () => {
  process.env.BUCKET_NAME = "unit-bucket";
  const dao = new AWSS3Dao();
  const url = await dao.getFileUrl("users/a.png");
  expect(url).toBe("https://unit-bucket.s3.amazonaws.com/users/a.png");
});

test("AWSS3Dao.uploadFile issues put and returns file URL", async () => {
  process.env.BUCKET_NAME = "unit-bucket";
  let captured = null;
  const dao = createDaoWithSend(async (command) => {
    captured = command.input;
    return {};
  });

  const url = await dao.uploadFile(
    "users/a.png",
    Buffer.from("x"),
    "image/png",
  );
  expect(captured.Bucket).toBe("unit-bucket");
  expect(captured.Key).toBe("users/a.png");
  expect(url).toBe("https://unit-bucket.s3.amazonaws.com/users/a.png");
});

test("AWSS3Dao.fileExists returns false when head throws", async () => {
  const dao = createDaoWithSend(async () => {
    throw new Error("NotFound");
  });

  const exists = await dao.fileExists("users/missing.png");
  expect(exists).toBe(false);
});
