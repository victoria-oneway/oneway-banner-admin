import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { publicId, fileBase64, fileType } = req.body;

  if (!publicId || !fileBase64 || !fileType) {
    return res.status(400).json({ error: "publicId, fileBase64, fileType 필요" });
  }

  const CLOUD_NAME = "dizlzp6ee";
  const API_KEY = "668345557544542";
  const API_SECRET = "7dzdOR39a2HJdZ-nOulg7OB3pvY";

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + API_SECRET)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", `data:${fileType};base64,${fileBase64}`);
  formData.append("public_id", publicId);
  formData.append("overwrite", "true");
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", API_KEY);
  formData.append("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.error?.message || "업로드 실패" });
    }

    return res.status(200).json(data);
  } catch (error) {