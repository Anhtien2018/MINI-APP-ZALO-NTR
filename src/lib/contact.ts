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

// Đang chạy trong app Zalo hay trên trình duyệt dev. import.meta.env.DEV chỉ
// true khi chạy `zmp start` (dev); bản build lên Zalo là production → false.
const isDev = Boolean(import.meta.env?.DEV);

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
    if (isDev) window.location.href = `tel:${phone}`;
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
    if (isDev) window.location.href = `sms:${phone}`;
    else await toast(`Không mở được tin nhắn. Số: ${phone}`);
  }
}

/** Mở Zalo của `zalo` (số điện thoại hoặc id). No-op nếu rỗng. */
export async function openZalo(zalo: string | null | undefined) {
  const id = cleanPhone(zalo) || (zalo ?? "").trim();
  if (!id) return;
  const url = `https://zalo.me/${id}`;
  try {
    const { openWebview } = await import("zmp-sdk/apis");
    await openWebview({ url });
  } catch (err) {
    console.warn("[contact] openWebview(zalo) failed:", err);
    if (isDev) window.open(url, "_blank");
    else await toast("Không mở được Zalo. Vui lòng thử lại.");
  }
}
