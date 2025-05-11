import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MessageModel from '../../models/messageModel';

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

interface WithTimestamps {
  created_at: Date;
  updated_at: Date;
}

describe('Message Model', () => {
  it('should save a message with name and valid user ObjectId', async () => {
    const message = new MessageModel({
      name: 'test name',
      user: new mongoose.Types.ObjectId(),
    });

    const saved = await message.save();

    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('test name');
    expect(saved.user).toBeDefined();
    expect((saved as unknown as WithTimestamps).created_at).toBeInstanceOf(
      Date,
    );
    expect((saved as unknown as WithTimestamps).updated_at).toBeInstanceOf(
      Date,
    );
  });

  it('should save a message without name and user', async () => {
    const message = new MessageModel({});

    const saved = await message.save();

    expect(saved._id).toBeDefined();
    expect(saved.name).toBeUndefined();
    expect(saved.user).toBeUndefined();
  });

  it('should throw an error when user is not a valid ObjectId', async () => {
    const message = new MessageModel({
      name: 'invalid user',
      user: 'not-an-objectid',
    });

    await expect(message.save()).rejects.toThrow(/Cast to ObjectId failed/i);
  });
});
