import type { NextApiHandler } from 'next';

export function compose(...middlewares: Array<(h: NextApiHandler) => NextApiHandler>) {
  return (handler: NextApiHandler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
