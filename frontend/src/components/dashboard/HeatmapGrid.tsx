import { useState, useLayoutEffect, useRef, memo, useCallback } from "react";
import HeatmapPopup from "./HeatmapPopup";

export interface CellData {
  id: string;
  risk: "healthy" | "monitor" | "diseased";
  treeId?: string;
  farm?: string;
  zone?: string;
  variety?: string;
  age?: number;
  riskScore?: number;
  status?: string;
  disease?: string;
  confidence?: number;
  lastInspection?: string;
  inspector?: string;
}

export interface ZoneSection {
  zoneName: string;
  trees: CellData[];
  healthyCount: number;
  monitoringCount: number;
  diseasedCount: number;
  totalCount: number;
}

const CELL_COLORS: Record<string, string> = {
  healthy: "bg-[#6EE7B7]",
  monitor: "bg-[#FDE68A]",
  diseased: "bg-[#F87171]",
};

const MAX_COLS = 20;
const CELL_SIZE = 18;
const CELL_GAP = 3;

interface HeatmapGridProps {
  sections: ZoneSection[];
}

function EmptyGrid() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-[13px] font-semibold text-gray-400">Không tìm thấy cây</p>
    </div>
  );
}

function HeatmapGridInner({ sections }: HeatmapGridProps) {
  const [popup, setPopup] = useState<{ cell: CellData; cellRect: DOMRect; containerRect: DOMRect } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const POPUP_MAX_W = 360;
  const POPUP_FALLBACK_H = 220;
  const PADDING = 8;

  const handleMouseEnter = useCallback((e: React.MouseEvent, cell: CellData) => {
    const cellRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setPopup({ cell, cellRect, containerRect });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPopup(null);
  }, []);

  const initialPos = popup
    ? {
        left: popup.cellRect.right - popup.containerRect.left + PADDING,
        top: popup.cellRect.top - popup.containerRect.top + popup.cellRect.height / 2 - POPUP_FALLBACK_H / 2,
      }
    : null;

  const [popupPos, setPopupPos] = useState<{ left: number; top: number } | null>(null);

  const pos = popupPos ?? initialPos;

  useLayoutEffect(() => {
    if (!popup) return;
    setPopupPos(null);

    const compute = () => {
      const el = popupRef.current;
      const containerEl = containerRef.current;
      if (!el || !containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();
      const r = popup.cellRect;

      const cellLeft = r.left - containerRect.left;
      const cellRight = r.right - containerRect.left;
      const cellTop = r.top - containerRect.top;
      const cellBottom = r.bottom - containerRect.top;

      const cw = containerEl.offsetWidth;
      const ch = containerEl.offsetHeight;
      const pw = Math.min(el.offsetWidth, POPUP_MAX_W, cw - PADDING * 2);
      const ph = el.offsetHeight || POPUP_FALLBACK_H;

      let left: number;
      const spaceRight = cw - cellRight - PADDING;
      const spaceLeft = cellLeft - PADDING;

      if (spaceRight >= pw) {
        left = cellRight + PADDING;
      } else if (spaceLeft >= pw) {
        left = cellLeft - pw - PADDING;
      } else {
        left = spaceRight >= spaceLeft ? cellRight + PADDING : cellLeft - pw - PADDING;
      }

      let top = cellTop + r.height / 2 - ph / 2;

      if (top + ph > ch - PADDING) {
        top = cellTop - ph - PADDING;
      }
      if (top < PADDING) {
        top = cellBottom + PADDING;
      }

      top = Math.max(PADDING, Math.min(top, ch - ph - PADDING));
      left = Math.max(PADDING, Math.min(left, cw - pw - PADDING));

      setPopupPos({ left, top });
    };

    compute();

    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [popup]);

  if (sections.length === 0) return <EmptyGrid />;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-col" style={{ gap: "24px" }}>
        {sections.map((section) => (
          <div key={section.zoneName}>
            <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
              <span className="text-[13px] font-bold text-gray-800">{section.zoneName}</span>
              <span className="text-[11px] text-gray-400">{section.totalCount} Cây</span>
              {section.totalCount > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 ml-auto">
                  Khỏe mạnh {Math.round(section.healthyCount / section.totalCount * 100)}%
                </span>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${MAX_COLS}, ${CELL_SIZE}px)`, gap: `${CELL_GAP}px` }}>
              {section.trees.map((tree) => (
                <div
                  key={tree.id}
                  className={`rounded-[4px] ${CELL_COLORS[tree.risk]} cursor-pointer transition-all duration-200 hover:brightness-75`}
                  style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                  role="gridcell"
                  aria-label={`Cây ${tree.treeId || ""} nguy cơ ${tree.risk}`}
                  tabIndex={0}
                  onMouseEnter={(e) => handleMouseEnter(e, tree)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={(e) => handleMouseEnter(e as unknown as React.MouseEvent, tree)}
                  onBlur={handleMouseLeave}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {popup && pos && (
        <div
          ref={popupRef}
          className="absolute z-[9999]"
          style={{
            left: pos.left,
            top: pos.top,
            maxWidth: "min(360px, calc(100% - 16px))",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
          role="tooltip"
        >
          <HeatmapPopup
            treeId={popup.cell.treeId || ""}
            farm={popup.cell.farm || ""}
            zone={popup.cell.zone || ""}
            disease={popup.cell.disease || ""}
            confidence={popup.cell.confidence}
            status={popup.cell.status || "Healthy"}
            riskScore={popup.cell.riskScore || 0}
          />
        </div>
      )}
    </div>
  );
}

const HeatmapGrid = memo(HeatmapGridInner);
export default HeatmapGrid;
