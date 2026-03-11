const baseUrl = "http://localhost:3000";

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function logResult(name, passed, details) {
  const label = passed ? "PASS" : "FAIL";
  console.log(`[${label}] ${name}${details ? ` - ${details}` : ""}`);
}

async function main() {
  const subject = `api-test-${Date.now()}`;
  const recipient = "apitest@example.com";
  let mailId;
  let failures = 0;

  try {
    await fetch(`${baseUrl}/inbox/health-check`);
  } catch (error) {
    console.error("Could not reach API server on http://localhost:3000.");
    console.error("Start the server first with: node server.js");
    process.exit(1);
  }

  const postBody = {
    from: "alice@test.com",
    to: recipient,
    subject,
    message: "self-run endpoint verification",
  };

  const postResult = await requestJson("/send", {
    method: "POST",
    body: JSON.stringify(postBody),
  });
  const postPassed =
    postResult.ok &&
    postResult.body?.success === true &&
    postResult.body?.response === "250 OK: message queued";
  logResult("POST /send", postPassed, JSON.stringify(postResult.body));
  if (!postPassed) failures += 1;

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const inboxResult = await requestJson(`/inbox/${recipient}`);
  const matchedMail = Array.isArray(inboxResult.body?.data)
    ? inboxResult.body.data.find((mail) => mail.subject === subject)
    : null;
  const inboxPassed =
    inboxResult.ok &&
    inboxResult.body?.success === true &&
    Boolean(matchedMail);
  logResult(
    "GET /inbox/:email",
    inboxPassed,
    matchedMail
      ? `found id ${matchedMail._id}`
      : JSON.stringify(inboxResult.body),
  );
  if (!inboxPassed) failures += 1;

  mailId = matchedMail?._id;

  const getResult = mailId
    ? await requestJson(`/mail/${mailId}`)
    : { ok: false, body: null };
  const getPassed = getResult.ok && getResult.body?.subject === subject;
  logResult("GET /mail/:id", getPassed, JSON.stringify(getResult.body));
  if (!getPassed) failures += 1;

  const deleteResult = mailId
    ? await requestJson(`/mail/${mailId}`, { method: "DELETE" })
    : { ok: false, body: null };
  const deletePassed =
    deleteResult.ok &&
    deleteResult.body?.message === "Email deleted successfully";
  logResult(
    "DELETE /mail/:id",
    deletePassed,
    JSON.stringify(deleteResult.body),
  );
  if (!deletePassed) failures += 1;

  const afterDeleteResult = mailId
    ? await requestJson(`/mail/${mailId}`)
    : { status: 0, body: null };
  const afterDeletePassed = afterDeleteResult.status === 404;
  logResult(
    "GET after DELETE",
    afterDeletePassed,
    `status ${afterDeleteResult.status}`,
  );
  if (!afterDeletePassed) failures += 1;

  console.log(`\nSummary: ${5 - failures} passed, ${failures} failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
