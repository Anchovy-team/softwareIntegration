import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MessageModel from '../models/messageModel';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await MessageModel.deleteMany();
});
