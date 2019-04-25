import { NotFound } from '@curveball/http-errors';
import bcrypt from 'bcrypt';
import * as otplib from 'otplib';
import database from '../database';
import { NewUser, User } from './types';

const fieldNames = [
  'id',
  'identity',
  'nickname',
  'created',
  'type',
];

export async function findAll(): Promise<User[]> {

  const query = `SELECT ${fieldNames.join(', ')} FROM users WHERE active = 1`;
  const result = await database.query(query);

  const users: User[] = [];
  for (const user of result[0]) {
    users.push(recordToModel(user));
  }
  return users;

}

export async function findById(id: number): Promise<User> {

  const query = `SELECT ${fieldNames.join(', ')} FROM users WHERE active = 1 AND id = ?`;
  const result = await database.query(query, [id]);

  if (result[0].length !== 1) {
    throw new NotFound('User with id: ' + id + ' not found');
  }

  return recordToModel(result[0][0]);

}
export async function findByIdentity(identity: string): Promise<User> {

  const query = `SELECT ${fieldNames.join(', ')} FROM users WHERE active = 1 AND identity = ?`;
  const result = await database.query(query, [identity]);

  if (result[0].length !== 1) {
    throw new NotFound('User with identity: ' + identity + ' not found');
  }

  return recordToModel(result[0][0]);

}

export async function save(user: User | NewUser): Promise<User> {

  if (!isExistingUser(user)) {

    // New user.
    const query = 'INSERT INTO users SET ?, created = UNIX_TIMESTAMP()';

    const newUserRecord = {
      identity: user.identity,
      nickname: user.nickname,
      type: user.type,
    };

    const result = await database.query(query, [newUserRecord]);

    return {
      id: result[0].insertId,
      ...user
    };

  } else {

    // Update user
    const query = 'UPDATE users SET ? WHERE id = ?';

    const updateUserRecord = {
      identity: user.identity,
      nickname: user.nickname,
    };

    await database.query(query, [updateUserRecord, user.id]);

    return user;

  }

}


type PasswordRow = {
  password: Buffer;
};

export async function createPassword(user: User, password: string): Promise<void> {

  const query = 'INSERT INTO user_passwords SET user_id = ?, password = ?';
  await database.query(query, [
    user.id,
    await bcrypt.hash(password, 12)
  ]);

}
/**
 * Returns true or false if the password was correct.
 *
 * Calling this method multiple times might result in a block.
 */
export async function validatePassword(user: User, password: string): Promise<boolean> {

  const query = 'SELECT password FROM user_passwords WHERE user_id = ?';
  const result = await database.query(query, [user.id]);

  const hashes = result[0].map( (row: PasswordRow) => row.password );

  for (const hash of hashes) {

    if (await bcrypt.compare(password, hash.toString('utf-8'))) {
      return true;
    }

  }

  return false;

}

/**
 * Returns true or false if the totp token was correct.
 *
 * Calling this method multiple times might result in a block.
 */
export async function validateTotp(user: User, token: string) {

  const query = 'SELECT secret FROM user_totp WHERE user_id = ?';
  const result = await database.query(query, [user.id]);

  if (!result[0].length) {
    // Not set up
    return false;
  }
  const secret = result[0][0].secret;

  return otplib.authenticator.check(token, secret);

}

type UserRecord = {
  id: number,
  identity: string,
  nickname: string,
  created: number,
  type: number,
};

function recordToModel(user: UserRecord): User {

  return {
    id: user.id,
    identity: user.identity,
    nickname: user.nickname,
    created: new Date(user.created * 1000),
    type: user.type,
  };

}

function isExistingUser(user: User | NewUser): user is User {

  return (<User> user).id !== undefined;

}
