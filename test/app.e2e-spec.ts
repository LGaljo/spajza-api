import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Set process.env.MONGO_URI to use an isolated test database BEFORE importing AppModule/config
const testMongoUri = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace(/\/([^\/]+)$/, '/spajza_test')
  : 'mongodb://localhost:27017/spajza_test';
process.env.MONGO_URI = testMongoUri;

import { AppModule } from '../src/app.module';
import { User, UserDocument } from '../src/modules/user/schemas/user.schema';
import { Role } from '../src/modules/user/schemas/roles.enum';
import { InventoryItem, InventoryItemDocument } from '../src/modules/inventoryitem/schemas/inventoryitem.schema';
import { Category, CategoryDocument } from '../src/modules/categories/schemas/category.schema';
import { env } from '../src/config/env';

describe('App & CRUD Modules (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>;
  let inventoryModel: Model<InventoryItemDocument>;
  let categoryModel: Model<CategoryDocument>;
  let mongooseConnection: Connection;

  let adminToken: string;
  let normalUserToken: string;
  let createdUserId: string;
  let createdItemId: string;
  let createdCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    inventoryModel = moduleFixture.get<Model<InventoryItemDocument>>(getModelToken(InventoryItem.name));
    categoryModel = moduleFixture.get<Model<CategoryDocument>>(getModelToken(Category.name));
    mongooseConnection = moduleFixture.get<Connection>(getConnectionToken());

    // Drop test database to start with a pristine test environment
    await mongooseConnection.db.dropDatabase();

    // 1. Seed test administrator
    const adminHash = await bcrypt.hash('admin123', env.SALT_ROUNDS);
    const adminUser = new userModel({
      username: 'admin_test',
      email: 'admin_test@spajza.com',
      role: Role.ADMIN,
      hash: adminHash,
      salt: env.SALT_ROUNDS,
    });
    await adminUser.save();

    // 2. Seed test normal user
    const userHash = await bcrypt.hash('user123', env.SALT_ROUNDS);
    const normalUser = new userModel({
      username: 'user_test',
      email: 'user_test@spajza.com',
      role: Role.USER,
      hash: userHash,
      salt: env.SALT_ROUNDS,
    });
    await normalUser.save();

    // 3. Seed a category
    const category = new categoryModel({
      name: 'Test Category',
    });
    const savedCategory = await category.save();
    createdCategoryId = savedCategory._id.toString();

    // 4. Authenticate as Admin to get JWT token
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin_test', password: 'admin123' })
      .expect(201);
    adminToken = adminLoginRes.body.data.access_token;

    // 5. Authenticate as Normal User to get JWT token
    const userLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'user_test', password: 'user123' })
      .expect(201);
    normalUserToken = userLoginRes.body.data.access_token;
  });

  afterAll(async () => {
    // Drop test database on finish and close connection to avoid hanging processes
    await mongooseConnection.db.dropDatabase();
    await app.close();
  });

  describe('Core Health Check', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect({ name: 'Spajza API', version: '1.0.0' });
    });
  });

  describe('User Module CRUD /users', () => {
    it('POST /users (Create / Register user)', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'crud_user',
          email: 'crud@spajza.com',
          password: 'password123',
          role: Role.ADMIN, // controller should strip role and set to UNAPPROVED by default
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('crud_user');
      expect(res.body.user.role).toBe(Role.UNAPPROVED); // Role successfully stripped/defaulted
      createdUserId = res.body.user._id;
    });

    it('GET /users (Read - Read all users)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // admin_test, user_test, and crud_user
    });

    it('GET /users (Read - Normal user access check)', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200); // Normal user should be permitted since Role.USER is annotated
    });

    it('GET /users/:id (Read - Read one user)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.username).toBe('crud_user');
    });

    it('PUT /users/:id (Update - Update user details)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'crud_user_updated',
          email: 'crud_updated@spajza.com',
        })
        .expect(200);

      expect(res.body.matchedCount).toBe(1);
      expect(res.body.modifiedCount).toBe(1);

      // Verify updates
      const verifyRes = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(verifyRes.body.username).toBe('crud_user_updated');
      expect(verifyRes.body.email).toBe('crud_updated@spajza.com');
    });

    it('PUT /users/:id/role (Update - Update user role)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${createdUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.USER })
        .expect(200);

      expect(res.body.role).toBe(Role.USER);
    });

    it('DELETE /users/:id (Delete - Soft delete user)', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is excluded from fetch all
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = res.body.find((u) => u._id === createdUserId);
      expect(found).toBeUndefined();
    });
  });

  describe('InventoryItem Module CRUD /inventory', () => {
    it('POST /inventory (Create - Create an item as admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pristine Test Item',
          owner: 'Luka',
          location: 'Main Shelf B',
          count: 10,
          description: 'Top-tier testing inventory component',
          category: createdCategoryId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe('Pristine Test Item');
      expect(res.body.category).toBe(createdCategoryId);
      createdItemId = res.body._id;
    });

    it('GET /inventory (Read - Fetch list)', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /inventory/:id (Read - Fetch single item details)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body._id).toBe(createdItemId);
      expect(res.body.name).toBe('Pristine Test Item');
    });

    it('PUT /inventory/:id (Update - Modify item)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/inventory/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pristine Test Item Updated',
          count: 14,
        })
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.name).toBe('Pristine Test Item Updated');
      expect(res.body.count).toBe(14);
    });

    it('DELETE /inventory/:id (Delete - Remove item)', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify item was deleted (marked retired or soft deleted, returns empty body)
      const res = await request(app.getHttpServer())
        .get(`/inventory/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.text).toBe('');
    });
  });
});
