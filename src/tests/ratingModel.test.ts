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

describe('Rating Model', () => {
  it('should create a rating successfully', async () => {
    const validRating = {
      movie_id: 1,
      email: 'test@epita.fr',
      rating: 4,
    };

    const rating = await Rating.create(validRating);
    expect(rating.movie_id).toBe(validRating.movie_id);
    expect(rating.email).toBe(validRating.email);
    expect(rating.rating).toBe(validRating.rating);
    expect((rating as any).created_at).toBeInstanceOf(Date);
  });

  it('should fail if required fields are missing', async () => {
    const invalidRating = {
      email: 'test@eita.fr',
      rating: 3,
    };

    await expect(Rating.create(invalidRating)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail if rating is out of bounds', async () => {
    const invalidRating = {
      movie_id: 1,
      email: 'test@epita.fr',
      rating: 10,
    };

    await expect(Rating.create(invalidRating)).rejects.toThrow(mongoose.Error.ValidationError);
  });
});
