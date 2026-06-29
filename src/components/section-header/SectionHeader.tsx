import "./SectionHeader.css";

interface SectionHeaderProps {
  title: string;
  titleHighlight?: string;
  highlightColor?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

export function SectionHeader({
  title,
  titleHighlight,
  highlightColor,
  onViewAll,
  viewAllLabel = "Xem tất cả",
}: SectionHeaderProps) {
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
      {onViewAll && (
        <button className="section-header__view-all" onClick={onViewAll}>
          {viewAllLabel} &rarr;
        </button>
      )}
    </div>
  );
}
