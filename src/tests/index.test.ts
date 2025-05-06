import test_function from '../tindex';

import { expect } from 'chai';

describe('Example', () => {
  it('It should pass', () => {
    const result = test_function();
    expect(result).to.equal('Hello world!');
  });
});
