import { Request, Response } from 'express';
import healthCheckRouter from '../../middleware/healthCheck';

describe('healthCheck middleware (unit)', () => {
  it('should send 200 and health message', () => {
    const route = healthCheckRouter.stack.find(
      (layer: unknown) =>
        typeof layer === 'object' &&
        layer !== null &&
        'route' in layer &&
        (layer as { route: { path: string } }).route.path === '/api/health',
    );
    expect(route).toBeDefined();

    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const handler = (
      route as unknown as {
        route: { stack: { handle: (req: Request, res: Response) => void }[] };
      }
    ).route.stack[0].handle;

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'All up and running !!' });
  });

  it('should not handle unknown route', () => {
    const route = healthCheckRouter.stack.find(
      (layer: unknown) =>
        typeof layer === 'object' &&
        layer !== null &&
        'route' in layer &&
        (layer as { route: { path: string } }).route.path === '/api/unknown',
    );
    expect(route).toBeUndefined();
  });
});
