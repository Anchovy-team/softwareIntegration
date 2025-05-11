import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Comment from '../models/commentModel';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Comment.deleteMany({});
});
