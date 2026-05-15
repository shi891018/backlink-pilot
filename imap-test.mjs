import { ImapFlow } from "imapflow";
const pw = "hrmx cqak jorl osdm".replace(/\s/g,"");
const client = new ImapFlow({
  host: "imap.gmail.com", port: 993, secure: true,
  auth: { user: "shijm1989@gmail.com", pass: pw },
  logger: false,
});
await client.connect();
await client.mailboxOpen("INBOX");
// Check all messages in last 1 hour
const msgs = await client.search({ since: new Date(Date.now()-3600*1000) });
console.log("INBOX last 1h total:", msgs.length);
for (const uid of msgs.slice(-10)) {
  const m = await client.fetchOne(uid, { envelope: true });
  console.log(" -", m.envelope?.subject, "|", m.envelope?.from?.[0]?.address);
}
// Also check [Gmail]/すべてのメール
await client.mailboxOpen("[Gmail]/すべてのメール");
const all = await client.search({ since: new Date(Date.now()-3600*1000) });
console.log("All Mail last 1h:", all.length);
await client.logout();
