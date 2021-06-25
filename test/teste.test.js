import app from "../src/app";
import supertest from "supertest";

describe("GET /teste", () => {
  it("returns status 200 for valid params", async () => {
    const result = await supertest(app).get("/teste");
    expect(result.status).toEqual(200);
  });
});
