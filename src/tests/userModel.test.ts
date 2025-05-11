import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/userModel';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterEach(async () => {
    await User.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('User model', () => {
    it('should create a valid user', async () => {
        const user = await User.create({
            username: 'username',
            email: 'test@epita.fr',
            password: 'admin',
        });
  
        expect(user).toBeDefined();
        expect(user.email).toBe('test@epita.fr');
        expect(user.username).toBe('username');
    });
  
    it('should fail without an email', async () => {
        try {
            await User.create({
                username: 'noemail',
                password: 'password',
            });
        } catch (err: any) {
            expect(err).toBeDefined();
            expect(err.errors.email).toBeDefined();
        }
    });
  
    it('should fail without a password', async () => {
        try {
        await User.create({
            username: 'nopassword',
            email: 'test@epita.fr',
        });
        } catch (err: any) {
            expect(err).toBeDefined();
            expect(err.errors.password).toBeDefined();
        }
    });
  
    it('should fail with duplicate email', async () => {
        await User.create({
            username: 'user1',
            email: 'duplicate@epita.fr',
            password: 'admin1',
        });

        try {
        await User.create({
            username: 'user2',
            email: 'duplicate@epita.fr',
            password: 'admin2',
        });
        } catch (err: any) {
            expect(err).toBeDefined();
            expect(err.code).toBe(11000);
        }
    });
});
