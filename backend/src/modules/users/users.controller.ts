import { Request, Response } from 'express';
import { UsersService } from './users.service';

export const getUsers = async (req: Request, res: Response) => {
  const users = await UsersService.getAllUsers();
  res.status(200).json({ success: true, data: users });
};

export const createUser = async (req: Request, res: Response) => {
  const user = await UsersService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await UsersService.updateUser(req.params.id as string, req.body);
  res.status(200).json({ success: true, data: user });
};

export const deleteUser = async (req: Request, res: Response) => {
  const result = await UsersService.deleteUser(req.params.id as string);
  res.status(200).json({ success: true, message: result.message });
};
