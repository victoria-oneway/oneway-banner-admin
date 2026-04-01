const CLOUD_NAME = "dizlzp6ee";
const UPLOAD_PRESET = "oneway_banners";

export const BANNER_SLOTS = [
  { id: "banner_slot_1", label: "배너 1" },
  { id: "banner_slot_2", label: "배너 2" },
  { id: "banner_slot_3", label: "배너 3" },
];

// 스마트스토어 HTML에 심을 고정 URL
export function getBannerUrl(slotId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${slotId}`;
}

// 업로드 직후 미리보기용 (캐시 무력화)
export function getBannerUrlFresh(slotId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${slotId}?t=${Date.now()}`;
}

export async function uploadBanner(slotId, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", slotId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "업로드 실패");
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