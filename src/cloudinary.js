const CLOUD_NAME = "dizlzp6ee";
const UPLOAD_PRESET = "oneway_banners";

export const BANNER_SLOTS = [
  { id: "banner_slot_1", label: "배너 1" },
  { id: "banner_slot_2", label: "배너 2" },
];

export function getBannerUrl(slotId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${slotId}.png`;
}

export function getBannerUrlFresh(slotId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${slotId}.png?t=${Date.now()}`;
}

export async function uploadBanner(slotId, file) {
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicId: slotId,
      fileBase64: base64,
      fileType: file.type,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "업로드 실패");
  }

  return await res.json();
}

export async function deleteBanner(slotId) {
  const svgBlob = new Blob(
    [`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" fill="#f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="32" fill="#ccc">배너 없음</text></svg>`],
    { type: "image/svg+xml" }
  );
  const file = new File([svgBlob], "empty.svg", { type: "image/svg+xml" });
  return await uploadBanner(slotId, file);
}