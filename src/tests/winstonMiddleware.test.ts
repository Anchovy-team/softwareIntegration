import * as winstonModule from '../middleware/winston';

describe('winston logger', () => {
  it('should log info to file and console without throwing', () => {
    expect(() => {
      winstonModule.logger.info('Test info message');
      winstonModule.logger.debug('Test debug message');
      winstonModule.logger.error('Test error message');
    }).not.toThrow();
  });

  it('stream.write should call logger.info', () => {
    const spy = jest.spyOn(winstonModule.logger, 'info');
    winstonModule.stream.write('Test stream message\n');
    expect(spy).toHaveBeenCalledWith('Test stream message');
    spy.mockRestore();
  });

  it('should handle error in logger gracefully', () => {
    const spy = jest
      .spyOn(winstonModule.logger, 'info')
      .mockImplementation(() => {
        throw new Error('Logger failed');
      });
    expect(() => winstonModule.stream.write('fail')).toThrow('Logger failed');
    spy.mockRestore();
  });
});
