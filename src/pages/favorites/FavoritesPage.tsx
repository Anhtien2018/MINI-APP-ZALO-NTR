import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import { useFavoritesStore } from "@/store";
import { getLarkPropertyByRecordId, extractLarkRecordId } from "@/services/api";
import type { ILarkProperty } from "@/types";
import "./FavoritesPage.css";

export function FavoritesPage() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const [properties, setProperties] = useState<ILarkProperty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favorites.length === 0) {
      setProperties([]);
      return;
    }
    setLoading(true);
    Promise.all(favorites.map((f) => getLarkPropertyByRecordId(f.propertyId).catch(() => null)))
      .then((results) => setProperties(results.filter(Boolean) as ILarkProperty[]))
      .finally(() => setLoading(false));
  }, [favorites]);

  return (
    <PageLayout>
      <div className="favorites-header">
        <h2 className="favorites-title">Yêu thích</h2>
        <span className="favorites-count">{favorites.length} bất động sản</span>
      </div>

      {loading ? (
        <div className="favorites-loading">
          <div className="spinner" />
        </div>
      ) : properties.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <div className="favorites-grid">
          {properties.map((p) => (
            <PropertyCard key={p.id} data={p} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

function EmptyFavorites() {
  const navigate = useNavigate();
  return (
    <div className="favorites-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          stroke="#ddd"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
      <p className="favorites-empty__text">Chưa có bất động sản yêu thích</p>
      <p className="favorites-empty__sub">Nhấn vào biểu tượng tim để lưu BĐS bạn quan tâm</p>
      <button className="favorites-empty__btn" onClick={() => navigate("/listings")}>
        Khám phá ngay
      </button>
    </div>
  );
}
