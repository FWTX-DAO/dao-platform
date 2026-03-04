import type { NextApiHandler, NextApiResponse } from 'next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: any, res: NextApiResponse) => any;

export function compose(...middlewares: Array<(h: NextApiHandler) => NextApiHandler>) {
  return (handler: AnyHandler): NextApiHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler as NextApiHandler);
  };
}
