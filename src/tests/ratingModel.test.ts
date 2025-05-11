import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Rating from '../models/ratingModel';

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
  await Rating.deleteMany({});
});
