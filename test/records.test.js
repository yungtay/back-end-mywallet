import { app } from "../src/app";
import { connection } from "../src/app";
import supertest from "supertest";


describe("GET /records", () => {
  it("returns status 401 for missing token", async () => {
    const result = await supertest(app).get("/records");
    expect(result.status).toEqual(401);
  });

  it("returns status 404 for invalid tokens", async () => {
    const result = await supertest(app).get("/records").set('Authorization', 'Bearer xxxxxxx');
    expect(result.status).toEqual(404);
  });

  it("returns status 200, the records and the name for valid tokens", async () => {
    const result = await supertest(app).get("/records").set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(expect.objectContaining({"records": expect.any(Array), "name": expect.any(String)}));
  });

});

describe("POST /records", () => {
  it("returns status 401 for missing token", async () => {
    const result = await supertest(app).post("/records");
    expect(result.status).toEqual(401);
  });

  it("returns status 200 for valid request with valid token", async () => {
    const body = {value: 100,  description: "SuperTest" }
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(200);
  });

  it("returns status 404 for valid request with invalid token", async () => {
    const body = {value: 100,  description: "SuperTest" }
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer xxxxxxx');
    expect(result.status).toEqual(404);
  });

  it("returns status 400 for requests with no property value", async () => {
    const body = { description: "SuperTest" }
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for requests with value 0", async () => {
    const body = {value: 0,  description: "SuperTest" }
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for requests with string-type value ", async () => {
    const body = {value: "oi",  description: "SuperTest" }
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for requests with float values", async () => {
    const body = {value: 100.1, description: "SuperTest"}
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for requests withouy description", async () => {
    const body = {value: 100.1}
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(400);
  });

  it("returns status 400 for requests with description empty", async () => {
    const body = {value: 100, description: ""}
    const result = await supertest(app).post("/records").send(body).set('Authorization', 'Bearer 41c3eca5-d868-4178-9301-2a511d828512');
    expect(result.status).toEqual(400);
  });
});

afterAll(() => {
  connection.end();
});

