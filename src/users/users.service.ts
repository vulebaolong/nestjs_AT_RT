import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateUserDto } from './dto/create-user.dto';
import { TUser } from './type/user.type';

@Injectable()
export class UsersService {
  private readonly filePath = path.resolve(__dirname, '../db/user.table.json');

  private readUsersFromFile(): any[] {
    const fileContent = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  private writeUsersToFile(users: any[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2), 'utf-8');
  }

  findAll(): any[] {
    return this.readUsersFromFile();
  }

  async findOne(email: string): Promise<TUser> {
    const users = this.readUsersFromFile();
    return users.find((user) => user.email === email);
  }

  async findById(id: number): Promise<TUser> {
    const users = this.readUsersFromFile();
    return users.find((user) => user.id === id);
  }

  async create(user: CreateUserDto) {
    const users = this.readUsersFromFile();

    const newUser: TUser = {
      id: users.length,
      email: ``,
      name: ``,
      password: ``,
      refreshToken: null,
      ...user,
    };

    users.push(newUser);
    this.writeUsersToFile(users);
    return newUser;
  }

  async updateByEmail(email: string, updatedUser: any) {
    const users = this.readUsersFromFile();
    const userIndex = users.findIndex((user) => user.email === email);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      this.writeUsersToFile(users);
    }
  }

  async updateById(id: number, updatedUser: any) {
    const users = this.readUsersFromFile();
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      this.writeUsersToFile(users);
    }
  }

  remove(email: string): void {
    let users = this.readUsersFromFile();
    users = users.filter((user) => user.email !== email);
    this.writeUsersToFile(users);
  }
}
