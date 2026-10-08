import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, EXAMPLE_POST, PUBLIC_URL } from "./api";
import { RULES } from "./refund";

const endpoints = Object.values(ENDPOINTS);

for (const e of endpoints) {
  const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

  test(`GET ${e.example} returns 200 with disclaimer and CORS`, async () => {
    const res = await handler(new Request(`${PUBLIC_URL}${e.example}`));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.equal(body.maxRefundJPY, 1500);
    assert.equal(body.groups[0].regime, "refund");
    assert.ok(body.checklist.length);
    assert.ok(body.sources.length);
    assert.ok(!("error" in body));
  });

  test(`POST ${e.path} with the report example returns maxRefundJPY 1940`, async () => {
    const res = await handler(
      new Request(`${PUBLIC_URL}${e.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(EXAMPLE_POST),
      }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.maxRefundJPY, 1940);
    assert.equal(body.groups.length, 2);
    assert.equal(body.currency, "JPY");
  });

  test(`POST ${e.path} with JSON body matches GET for a single receipt`, async () => {
    const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}`);
    const body: Record<string, unknown> = {};
    for (const [k, v] of url.searchParams) body[k] = body[k] === undefined ? v : ([] as unknown[]).concat(body[k], v);
    const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
    const get = await handler(new Request(url));
    assert.equal(post.status, 200);
    assert.deepEqual(await post.json(), await get.json());
  });

  test(`${e.path} without required input returns 400 with an example`, async () => {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}`));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
  });
}

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI spec lists refund with GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, endpoints) as { paths: Record<string, { get: unknown; post: unknown }> };
  for (const e of endpoints) {
    assert.ok(spec.paths[e.path]?.get, e.path);
    assert.ok(spec.paths[e.path]?.post, e.path);
  }
});

test("rules table has both regimes and sources", () => {
  assert.equal(RULES.regimes.length, 2);
  assert.ok(RULES.sources.length >= 3);
  assert.ok(RULES.disclaimer);
});
