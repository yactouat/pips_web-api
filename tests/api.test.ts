import { createTestUser, truncateXTable } from "./helpers";
import saveUserToken from "pips_shared/dist/functions/save-user-token";

const request = require('supertest');
const {API} = require('../src/api');

beforeAll(async () => {
    await truncateXTable("users");
    await truncateXTable("tokens");
    await truncateXTable("tokens_users");
});

describe("PUT /api/users/token-auth", () => {

    it("with a valid token and email, should return a 200 status code, a message, and a user payload", async () => {
        // arrange
        const user = await createTestUser();
        const token = await saveUserToken(user.email, "User_Authentication");

        // act
        const res = await request(API)
            .put(`/users/token-auth`)
            .send({
                email: user.email,
                token: token
            });

        // assert
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('msg');
        expect(res.body.msg).toEqual("user fetched successfully");
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).not.toBe(null);

        expect(res.body.data).toHaveProperty('token');
        // regex to match a JWT token
        const resToken = res.body.data.token;
        const resTokenRegex = new RegExp(/^[a-zA-Z0-9-_]*\.[a-zA-Z0-9-_]*\.[a-zA-Z0-9-_]*$/);
        expect(resTokenRegex.test(resToken)).toBe(true);

        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user).toHaveProperty('id');
        expect(res.body.data.user.id).toEqual(user.id);
        expect(res.body.data.user).toHaveProperty('email');
        expect(res.body.data.user.email).toEqual(user.email);
        expect(res.body.data.user).toHaveProperty('socialhandle');
        expect(res.body.data.user.socialhandle).toEqual("handle");
        expect(res.body.data.user).toHaveProperty('socialhandletype');
        expect(res.body.data.user.socialhandletype).toEqual("LinkedIn");
        expect(res.body.data.user).toHaveProperty('verified');
        expect(res.body.data.user.verified).toEqual(user.verified);
    });

});