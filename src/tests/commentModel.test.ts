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

describe('Comment Model', () => {
  it('should create a comment successfully', async () => {
    const validComment = {
      movie_id: 1,
      username: 'usernname',
      comment: 'One of the best movies I have ever seen!',
      title: 'Awesome',
      rating: 5,
    };

    const comment = await Comment.create(validComment);
    expect(comment.movie_id).toBe(validComment.movie_id);
    expect(comment.username).toBe(validComment.username);
    expect(comment.comment).toBe(validComment.comment);
    expect(comment.title).toBe(validComment.title);
    expect(comment.rating).toBe(validComment.rating);
    expect(comment.downvotes).toBe(0);
    expect(comment.upvotes).toBe(0);
    expect((comment as any).created_at).toBeInstanceOf(Date);
  });

  it('should fail if required fields are missing', async () => {
    const invalidComment = {
      username: 'username',
      comment: 'Missing movie_id',
      title: 'Dissapointment',
      rating: 3,
    };

    await expect(Comment.create(invalidComment)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail if rating is out of bounds', async () => {
    const invalidComment = {
      movie_id: 1,
      username: 'username',
      comment: 'Bad rating',
      title: 'Invalid rating',
      rating: 10,
    };

    await expect(Comment.create(invalidComment)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail if downvotes is negative', async () => {
    const invalidComment = {
      movie_id: 1,
      username: 'username',
      comment: 'Negative downvotes',
      title: 'Oops',
      rating: 4,
      downvotes: -1,
    };

    await expect(Comment.create(invalidComment)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail if upvotes is negative', async () => {
    const invalidComment = {
      movie_id: 1,
      username: 'username',
      comment: 'Negative upvotes',
      title: 'Oops',
      rating: 4,
      upvotes: -2,
    };

    await expect(Comment.create(invalidComment)).rejects.toThrow(mongoose.Error.ValidationError);
  });
});
