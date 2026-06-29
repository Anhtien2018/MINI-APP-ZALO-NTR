import { useNavigate } from "react-router-dom";
import "./SectionHeader.css";

interface SectionHeaderProps {
  title: string;
  titleHighlight?: string;
  highlightColor?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
}

export function SectionHeader({
  title,
  titleHighlight,
  highlightColor,
  viewAllLink,
  viewAllLabel = "Xem tất cả",
}: SectionHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="section-header">
      <div className="section-header__left">
        <span className="section-header__bar" />
        <h2 className="section-header__title">
          {title}
          {titleHighlight && (
            <span
              className="section-header__highlight"
              style={highlightColor ? { color: highlightColor } : undefined}
            >
              {" "}
              {titleHighlight}
            </span>
          )}
        </h2>
      </div>
      {viewAllLink && (
        <button className="section-header__view-all" onClick={() => navigate(viewAllLink)}>
          {viewAllLabel} &rarr;
        </button>
      )}
    </div>
  );
}
