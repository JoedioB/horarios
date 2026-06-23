"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
describe('GET /', () => {
    it('deve retornar 200 na página inicial', async () => {
        const res = await (0, supertest_1.default)(app_1.app).get('/');
        expect(res.statusCode).toEqual(200);
    });
});
