import { Response } from 'express';

const notFoundMiddleware = (res: Response): void => {
  const err = new Error('Not Found');
  res.status(404).json({
    error: {
      message: err.message,
    },
  });
};

export default notFoundMiddleware;
