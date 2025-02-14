export default function decodeJWT(token: string) {
  const [header, payload, signature] = token.split(".");
  return {
    header: JSON.parse(Buffer.from(header, "base64").toString()),
    payload: JSON.parse(Buffer.from(payload, "base64").toString()),
    signature,
  };
}
