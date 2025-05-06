import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      username: string;
      _id: string;
      email: string;
      messages: string[];
    };
  }
}
