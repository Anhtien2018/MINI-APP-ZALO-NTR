// Liên hệ (gọi / nhắn tin / Zalo) — gom về một chỗ để mọi nút trong app hành
// xử giống nhau. Trong Zalo Mini App phải dùng API native của zmp-sdk (các
// quyền dưới đây đều "Đã cấp quyền" trong Mini App Console):
//   - openPhone  (ID 16): mở trình gọi điện
//   - openSMS    (ID 17): mở trình nhắn tin
//   - openWebview(ID 32): mở zalo.me trong webview để nhắn Zalo.
// KHÔNG dùng openOutApp: app này không có quyền "mở app ngoài" → trả -1403.
//
// Khi native ném lỗi (thiết bị không hỗ trợ, người dùng huỷ, đang chạy trong
// giả lập Zalo Studio…) ta KHÔNG được rơi về `window.location.href='tel:'`
// ngay trong webview Zalo: thao tác đó lại kích hoạt cầu nối native và ném ra
// đúng lỗi `dispatchMessageFromObjC` khó hiểu. Vì vậy chỉ fallback scheme khi
// đang chạy ngoài Zalo (dev trên trình duyệt); còn trong Zalo thì báo toast.

// Chỉ giữ lại chữ số và dấu +; Zalo native từ chối số có dấu cách/(-)/… .
function cleanPhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[^\d+]/g, "");
}

// Đang chạy trong webview Zalo thật hay trình duyệt thường. Không dùng
// import.meta.env.DEV: flag đó phản ánh build mode (zmp start vs build),
// không phải môi trường chạy — khi test bằng cách quét QR `zmp start` ngay
// trong app Zalo, DEV vẫn true dù đang ở trong webview Zalo thật, khiến
// code rơi vào nhánh tel:/window.open ngay trong Zalo và ném lỗi
// dispatchMessageFromObjC như mô tả ở trên. Webview Zalo luôn có "Zalo"
// trong User-Agent, dùng để phân biệt đúng môi trường.
const isInZaloApp = typeof navigator !== "undefined" && /Zalo/i.test(navigator.userAgent);

async function toast(message: string) {
  try {
    const { showToast } = await import("zmp-sdk/apis");
    await showToast({ message });
  } catch {
    /* ngoài Zalo thì bỏ qua */
  }
}

/** Gọi điện tới `phone`. No-op nếu số rỗng. */
export async function callPhone(phoneRaw: string | null | undefined) {
  const phone = cleanPhone(phoneRaw);
  if (!phone) return;
  try {
    const { openPhone } = await import("zmp-sdk/apis");
    await openPhone({ phoneNumber: phone });
  } catch (err) {
    console.warn("[contact] openPhone failed:", err);
    if (!isInZaloApp) window.location.href = `tel:${phone}`;
    else await toast(`Không gọi được. Vui lòng gọi trực tiếp: ${phone}`);
  }
}

/** Nhắn tin SMS tới `phone`. No-op nếu số rỗng. */
export async function sendSMS(phoneRaw: string | null | undefined, content = "") {
  const phone = cleanPhone(phoneRaw);
  if (!phone) return;
  try {
    const { openSMS } = await import("zmp-sdk/apis");
    await openSMS({ phoneNumber: phone, content });
  } catch (err) {
    console.warn("[contact] openSMS failed:", err);
    if (!isInZaloApp) window.location.href = `sms:${phone}`;
    else await toast(`Không mở được tin nhắn. Số: ${phone}`);
  }
}

/** Mở Zalo của `zalo` (số điện thoại hoặc id). No-op nếu rỗng. */
export async function openZalo(zalo: string | null | undefined) {
  const id = cleanPhone(zalo) || (zalo ?? "").trim();
  if (!id) return;
  await openExternalLink(`https://zalo.me/${id}`, "Không mở được Zalo. Vui lòng thử lại.");
}

// Mọi link ngoài (360 độ, Zalo…) đều phải qua openWebview — thẻ <a target="_blank">
// thường bị Zalo chặn vì app không có quyền "mở app ngoài" (xem đầu file).
export async function openExternalLink(
  url: string,
  failMessage = "Không mở được liên kết. Vui lòng thử lại.",
) {
  try {
    const { openWebview } = await import("zmp-sdk/apis");
    await openWebview({ url, config: { style: "normal" } });
  } catch (err) {
    console.warn("[contact] openWebview failed:", err);
    if (!isInZaloApp) window.open(url, "_blank");
    else await toast(failMessage);
  }
}
