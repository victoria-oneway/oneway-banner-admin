const CLOUD_NAME = "dizlzp6ee";
const UPLOAD_PRESET = "oneway_banners";

// 배너 슬롯별 고정 public_id
export const BANNER_SLOTS = [
  { id: "banner_slot_1", label: "배너 1" },
  { id: "banner_slot_2", label: "배너 2" },
  { id: "banner_slot_3", label: "배너 3" },
];

// 고정 URL 생성 (항상 같은 URL)
export function getBannerUrl(slotId) {
  // 버전 파라미터로 캐시 무효화
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/banners/${slotId}`;
}

// 캐시 버스팅용 URL (업로드 직후 미리보기에 사용)
export function getBannerUrlFresh(slotId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/banners/${slotId}?t=${Date.now()}`;
}

// 이미지 업로드 (같은 public_id로 덮어쓰기)
export async function uploadBanner(slotId, file) {
  const formData = new FormData();
  formData.append("public_id", slotId);
formData.append("folder", "banners");

  // GIF는 resource_type을 image로 유지 (Cloudinary가 자동 처리)
  const resourceType = "image";

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "업로드 실패");
  }

  return await res.json();
}

// 이미지 삭제 (프론트에서 직접 삭제는 API Secret 필요 → placeholder 이미지로 교체)
export async function deleteBanner(slotId) {
  // placeholder SVG를 업로드해서 "삭제" 효과
  const svgBlob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" fill="#f5f5f5"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="32" fill="#ccc">배너 없음</text></svg>`], { type: "image/svg+xml" });
  const file = new File([svgBlob], "empty.svg", { type: "image/svg+xml" });
  return await uploadBanner(slotId, file);
}
