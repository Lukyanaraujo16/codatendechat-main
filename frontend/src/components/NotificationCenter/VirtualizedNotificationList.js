import React, { useMemo, useRef, useState, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";

const SECTION_HEIGHT = 40;
const ITEM_HEIGHT = 68;
const OVERSCAN = 3;

const useStyles = makeStyles({
  scroller: {
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
  },
  inner: {
    position: "relative",
    width: "100%",
  },
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    boxSizing: "border-box",
  },
});

function rowHeight(row) {
  return row.rowType === "section" ? SECTION_HEIGHT : ITEM_HEIGHT;
}

export default function VirtualizedNotificationList({
  rows,
  height = 360,
  renderSection,
  renderItem,
}) {
  const classes = useStyles();
  const scrollerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  const layout = useMemo(() => {
    let offset = 0;
    return (rows || []).map((row) => {
      const h = rowHeight(row);
      const entry = { row, top: offset, height: h };
      offset += h;
      return entry;
    });
  }, [rows]);

  const totalHeight = useMemo(() => {
    if (!layout.length) return 0;
    const last = layout[layout.length - 1];
    return last.top + last.height;
  }, [layout]);

  const visible = useMemo(() => {
    const viewBottom = scrollTop + height;
    return layout.filter(
      (entry) =>
        entry.top + entry.height > scrollTop - OVERSCAN * ITEM_HEIGHT &&
        entry.top < viewBottom + OVERSCAN * ITEM_HEIGHT
    );
  }, [layout, scrollTop, height]);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollerRef}
      className={classes.scroller}
      style={{ height }}
      onScroll={onScroll}
    >
      <div className={classes.inner} style={{ height: totalHeight }}>
        {visible.map(({ row, top, height: h }) => (
          <div
            key={row.key}
            className={classes.row}
            style={{ top, height: h }}
          >
            {row.rowType === "section"
              ? renderSection(row)
              : renderItem(row.notification)}
          </div>
        ))}
      </div>
    </div>
  );
}
