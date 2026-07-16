import { Request, Response } from 'express';
function foo(req: Request) {
  const targetMonth = req.query.month ? String(req.query.month) : undefined;
}
