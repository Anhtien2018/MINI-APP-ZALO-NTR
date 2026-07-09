import { useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import "./TopSearchBar.css";

interface TopSearchBarProps {
  // Trang tab gốc (trang chủ, 360) không cần back → ẩn để ô search full chiều.
  showBack?: boolean;
  onBack?: () => void;
}

// Thanh trắng cố định ở đỉnh: [back] + [ô search]. Dùng chung cho trang nội
// dung (qua PageLayout) lẫn trang chủ / 360 full-screen.
export function TopSearchBar({ showBack = true, onBack }: TopSearchBarProps) {
  return (
    <div className="page-topbar">
      <SearchBar />
    </div>
  );
}
