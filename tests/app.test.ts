import request from 'supertest';
import { app } from '../app';

describe('GET /', () => {
    it('deve retornar 200 na página inicial', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
    });
});
