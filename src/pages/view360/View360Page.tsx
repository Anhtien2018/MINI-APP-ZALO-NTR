import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAppStore } from "@/store";
import {
  getLarkPropertiesPaginated,
  getLarkPropertyFirstImage,
  generatePropertySlug,
} from "@/services/api";
import type { ILarkProperty } from "@/types";
import { ROUTES } from "@/constants";
import "./View360Page.css";

export function View360Page() {
  const navigate = useNavigate();
  const webConfig = useAppStore((s) => s.webConfig);
  const [properties, setProperties] = useState<ILarkProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [active3D, setActive3D] = useState<string | null>(null);

  const statusActive = webConfig?.status_properties?.active ?? undefined;

  useEffect(() => {
    getLarkPropertiesPaginated({
      page: 1,
      limit: 50,
      status: statusActive,
    })
      .then((r) => {
        const with3D = r.data.filter((p) => p.link_3d);
        setProperties(with3D);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusActive]);

  if (active3D) {
    return (
      <PageLayout hideBottomNav headerTitle="Tour 360°" onBack={() => setActive3D(null)}>
        <div className="view360-frame-wrap">
          <iframe src={active3D} className="view360-frame" allowFullScreen title="360 Tour" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="view360-header">
        <h2 className="view360-title">Xem 360°</h2>
        <span className="view360-count">{properties.length} tour ảo</span>
      </div>

      {loading ? (
        <div className="view360-loading">
          <div className="spinner" />
        </div>
      ) : properties.length === 0 ? (
        <div className="view360-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#ddd" strokeWidth="1.5" />
            <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#ddd" strokeWidth="1.5" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#ddd" strokeWidth="1.5" />
          </svg>
          <p>Chưa có tour 360° nào</p>
        </div>
      ) : (
        <div className="view360-list">
          {properties.map((p) => {
            const image = getLarkPropertyFirstImage(p);
            const slug = generatePropertySlug(p.tieu_de, p.lark_record_id);
            return (
              <div key={p.id} className="view360-card">
                <div className="view360-card__img-wrap" onClick={() => setActive3D(p.link_3d!)}>
                  {image ? (
                    <img src={image} alt={p.tieu_de} className="view360-card__img" />
                  ) : (
                    <div className="view360-card__no-img" />
                  )}
                  <div className="view360-card__play">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)" />
                      <path d="M10 8l6 4-6 4V8z" fill="white" />
                    </svg>
                    <span>360°</span>
                  </div>
                </div>
                <div className="view360-card__info">
                  <p className="view360-card__title" onClick={() => navigate(ROUTES.DETAIL(slug))}>
                    {p.tieu_de}
                  </p>
                  <div className="view360-card__actions">
                    <button
                      className="view360-card__btn view360-card__btn--tour"
                      onClick={() => setActive3D(p.link_3d!)}
                    >
                      Xem tour ảo
                    </button>
                    <button
                      className="view360-card__btn view360-card__btn--detail"
                      onClick={() => navigate(ROUTES.DETAIL(slug))}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
