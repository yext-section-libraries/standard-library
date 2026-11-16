import * as React from "react";

export type PreviewAxis = "horizontal" | "vertical";
function Diagram({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="sl-control-diagram"
      width="44"
      height="30"
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {children}
    </svg>
  );
}
const frame = (
  <rect
    x="4"
    y="3"
    width="40"
    height="26"
    rx="3"
    strokeDasharray="2 3"
    opacity=".45"
  />
);
const block = (x: number, y: number, w: number, h: number, key?: number) => (
  <rect
    key={key}
    x={x}
    y={y}
    width={w}
    height={h}
    rx="1.5"
    fill="currentColor"
    fillOpacity=".22"
  />
);
const arrow = (x1: number, y1: number, x2: number, y2: number) => {
  const horizontal = y1 === y2;
  const sign = horizontal ? Math.sign(x2 - x1) : Math.sign(y2 - y1);
  return (
    <>
      <path d={`M${x1} ${y1}L${x2} ${y2}`} />
      <path
        d={
          horizontal
            ? `M${x2 - sign * 3} ${y2 - 3}L${x2} ${y2}L${x2 - sign * 3} ${y2 + 3}`
            : `M${x2 - 3} ${y2 - sign * 3}L${x2} ${y2}L${x2 + 3} ${y2 - sign * 3}`
        }
      />
    </>
  );
};

/** These are effect diagrams, not generic decorative icons. Labels stay visible too. */
export function ControlPreview({
  property,
  value,
  axis = "horizontal",
}: {
  property: string;
  value: string;
  axis?: PreviewAxis;
}) {
  if (value === "inherit")
    return (
      <Diagram>
        {block(15, 2, 18, 8)}
        {arrow(24, 12, 24, 20)}
        {block(18, 23, 12, 7)}
      </Diagram>
    );
  if (property === "custom")
    return (
      <Diagram>
        <path d="M5 8h38M5 16h38M5 24h38" />
        <circle cx="15" cy="8" r="3" fill="white" />
        <circle cx="33" cy="16" r="3" fill="white" />
        <circle cx="21" cy="24" r="3" fill="white" />
      </Diagram>
    );
  if (property === "color" || property.toLowerCase().includes("color"))
    return <span className="sl-swatch" style={{ background: value }} />;
  if (property === "gridTemplateColumns") {
    const auto = value.includes("auto-fit");
    const count = auto
      ? 3
      : Number(
          value.match(/repeat\((\d)/)?.[1] ??
            (value.match(/minmax/g)?.length || 1)
        );
    return (
      <span
        className="sl-columns-preview"
        style={{ gridTemplateColumns: auto ? "repeat(3,1fr)" : value }}
      >
        {Array.from({ length: Math.min(count, 4) }, (_, i) => (
          <i key={i} />
        ))}
        {auto && <span className="sl-auto-columns">↔</span>}
      </span>
    );
  }
  if (
    [
      "fontSize",
      "fontFamily",
      "fontWeight",
      "fontStyle",
      "textDecoration",
      "textTransform",
    ].includes(property)
  )
    return (
      <span
        className="sl-type-preview"
        style={
          property === "fontWeight"
            ? { fontWeight: value }
            : property === "fontFamily"
              ? { fontFamily: value }
              : property === "fontStyle"
                ? { fontStyle: value }
                : property === "textDecoration"
                  ? { textDecoration: value }
                  : property === "textTransform"
                    ? {
                        textTransform:
                          value as React.CSSProperties["textTransform"],
                      }
                    : {
                        fontSize:
                          value === "0.875rem"
                            ? 14
                            : value === "1.25rem"
                              ? 23
                              : 19,
                      }
        }
      >
        {property === "textTransform" && value === "uppercase"
          ? "AA"
          : property === "textTransform" && value === "lowercase"
            ? "aa"
            : "Aa"}
      </span>
    );
  if (property === "borderRadius")
    return (
      <span className="sl-radius-preview" style={{ borderRadius: value }} />
    );
  if (property === "boxShadow")
    return <span className="sl-shadow-preview" style={{ boxShadow: value }} />;
  if (property === "textAlign") {
    const widths = value === "justify" ? [36, 36, 36] : [36, 22, 29];
    return (
      <Diagram>
        {widths.map((w, i) => (
          <path
            key={i}
            d={`M${value === "end" ? 42 - w : value === "center" ? (48 - w) / 2 : 6} ${7 + i * 9}h${w}`}
            strokeWidth="2.5"
          />
        ))}
      </Diagram>
    );
  }
  if (property === "alignItems" || property === "alignSelf") {
    const vertical = axis === "vertical";
    const sizes = vertical ? [9, 20, 14] : [14, 28, 21];
    const edge = value === "end" ? 1 : value === "center" ? 0.5 : 0;
    return (
      <Diagram>
        {frame}
        {sizes.map((size, i) => {
          const length = value === "stretch" ? (vertical ? 20 : 34) : size;
          return vertical
            ? block(9 + i * 12, 6 + (20 - length) * edge, 6, length, i)
            : block(7 + (34 - length) * edge, 7 + i * 8, length, 4, i);
        })}
        {vertical ? (
          <path
            d={`M6 ${value === "end" ? 26 : value === "center" ? 16 : 6}h36`}
            strokeDasharray="2 2"
          />
        ) : (
          <path
            d={`M${value === "end" ? 41 : value === "center" ? 24 : 7} 5v22`}
            strokeDasharray="2 2"
          />
        )}
      </Diagram>
    );
  }
  if (property === "justifyContent") {
    const vertical = axis === "vertical";
    const points =
      value === "space-between"
        ? [5, 21, 37]
        : value === "space-around"
          ? [8, 21, 34]
          : value === "space-evenly"
            ? [10, 21, 32]
            : value === "end"
              ? [23, 30, 37]
              : value === "center"
                ? [14, 21, 28]
                : [5, 12, 19];
    return (
      <Diagram>
        {frame}
        {points.map((p, i) =>
          vertical
            ? block(18, 3 + (p - 3) * 0.64, 12, 4, i)
            : block(p, 10, 6, 12, i)
        )}
      </Diagram>
    );
  }
  if (
    property === "arrangement" ||
    property === "flexDirection" ||
    property === "display" ||
    property === "flexWrap"
  ) {
    const vertical = value.includes("column");
    const reverse = value.includes("reverse");
    return (
      <Diagram>
        {frame}
        {value === "none" ? (
          <>
            <path d="m9 7 30 18M39 7 9 25" />
          </>
        ) : value === "grid" ? (
          <>
            {[0, 1, 2, 3].map((i) =>
              block(10 + (i % 2) * 17, 7 + Math.floor(i / 2) * 11, 11, 7, i)
            )}
          </>
        ) : value === "wrap" ? (
          <>
            {block(9, 7, 11, 7)}
            {block(27, 7, 11, 7)}
            {block(9, 20, 11, 6)}
            <path d="M39 18H27l3-3m-3 3 3 3" />
          </>
        ) : vertical || value === "block" ? (
          <>
            {block(10, 6, 28, 7)}
            {block(10, 20, 28, 7)}
            {value !== "block" &&
              (reverse ? arrow(41, 24, 41, 9) : arrow(41, 9, 41, 24))}
          </>
        ) : value === "inline" || value === "inline-block" ? (
          <>
            <path d="M8 10h10m17 0h5M8 23h32" />
            {block(22, 5, 10, value === "inline-block" ? 14 : 8)}
          </>
        ) : (
          <>
            {block(8, 7, 10, 18)}
            {block(30, 7, 10, 18)}
            {reverse ? arrow(28, 16, 20, 16) : arrow(20, 16, 28, 16)}
          </>
        )}
      </Diagram>
    );
  }
  if (property === "gridAutoFlow")
    return (
      <Diagram>
        {[0, 1, 2, 3, 4, 5].map((i) =>
          block(7 + (i % 3) * 13, 5 + Math.floor(i / 3) * 13, 9, 9, i)
        )}
        {value === "dense" ? (
          <>
            <rect
              x="20"
              y="5"
              width="9"
              height="9"
              rx="1"
              fill="currentColor"
            />
            <path d="m22 9 2 2 4-4" stroke="white" />
          </>
        ) : value === "column" ? (
          <>
            {arrow(11, 8, 11, 24)}
            {arrow(24, 8, 24, 24)}
          </>
        ) : (
          <>
            {arrow(10, 9, 36, 9)}
            {arrow(10, 22, 36, 22)}
          </>
        )}
      </Diagram>
    );
  if (["gap", "rowGap", "columnGap"].includes(property)) {
    const spacing =
      value === "0"
        ? 1
        : value.includes("space-2")
          ? 3
          : value.includes("space-4")
            ? 6
            : value.includes("space-6")
              ? 9
              : 12;
    return (
      <Diagram>
        {property === "rowGap" ? (
          <>
            {block(8, 3, 32, 7)}
            {block(8, 10 + spacing, 32, 7)}
            {arrow(5, 10, 5, 10 + Math.max(4, spacing))}
          </>
        ) : property === "columnGap" ? (
          <>
            {block(6, 5, 10, 22)}
            {block(16 + spacing, 5, 10, 22)}
            {arrow(16, 29, 16 + Math.max(4, spacing), 29)}
          </>
        ) : (
          <>
            {[0, 1, 2, 3].map((i) =>
              block(
                10 + (i % 2) * (9 + spacing / 2),
                5 + Math.floor(i / 2) * (9 + spacing / 2),
                8,
                8,
                i
              )
            )}
          </>
        )}
      </Diagram>
    );
  }
  if (
    /^(width|height|minWidth|maxWidth|minHeight|maxHeight|flexBasis|aspectRatio)$/.test(
      property
    )
  ) {
    const vertical = property.toLowerCase().includes("height");
    const full = value === "100%" || value.includes("svh") || value === "none";
    const content = value === "fit-content";
    const extent = full ? 34 : content ? 15 : value === "0" ? 8 : 25;
    return (
      <Diagram>
        {frame}
        {property === "aspectRatio" ? (
          <rect
            x={value === "1" ? 13 : value === "3 / 4" ? 16 : 7}
            y={5}
            width={value === "1" ? 22 : value === "3 / 4" ? 16 : 34}
            height={22}
            rx="2"
            fill="currentColor"
            fillOpacity=".2"
          />
        ) : (
          <>
            {vertical
              ? block(11, 5, 23, Math.min(22, extent * 0.65))
              : block(7, 7, extent, 16)}
            {vertical ? arrow(39, 6, 39, 25) : arrow(8, 27, 40, 27)}
            {content && <path d="M10 11h8m-8 5h5" />}
          </>
        )}
      </Diagram>
    );
  }
  if (
    property.startsWith("padding") ||
    property.startsWith("margin") ||
    property.startsWith("inset")
  ) {
    const outside = property.startsWith("margin");
    const top = property.endsWith("Start") && !property.includes("Inline");
    const bottom = property.includes("BlockEnd");
    const left = property.includes("InlineStart");
    const all = property === "padding" || property === "margin";
    return (
      <Diagram>
        {frame}
        {block(14, 10, 20, 12)}
        {(top || all) && arrow(24, outside ? 0 : 4, 24, 9)}
        {(bottom || all) && arrow(24, outside ? 32 : 28, 24, 23)}
        {(left || all) && arrow(outside ? 0 : 5, 16, 13, 16)}
        {((!top && !bottom && !left) || all) &&
          arrow(outside ? 48 : 43, 16, 35, 16)}
      </Diagram>
    );
  }
  if (property === "flexGrow" || property === "flexShrink")
    return (
      <Diagram>
        {frame}
        {block(7, 7, value === "1" ? 23 : 12, 18)}
        {block(value === "1" ? 34 : 23, 7, 7, 18)}
        {value === "1" ? arrow(12, 16, 27, 16) : <path d="M11 12v8m4-8v8" />}
      </Diagram>
    );
  if (property === "gridColumn" || property === "gridRow")
    return (
      <Diagram>
        {[0, 1, 2, 3].map((i) =>
          block(7 + (i % 2) * 18, 5 + Math.floor(i / 2) * 12, 14, 9, i)
        )}
        {value.includes("span") || value.includes("/") ? (
          <rect
            x="7"
            y="5"
            width={property === "gridRow" ? 14 : 32}
            height={property === "gridRow" ? 21 : 9}
            rx="2"
            fill="currentColor"
            fillOpacity=".45"
          />
        ) : (
          arrow(10, 9, 36, 9)
        )}
      </Diagram>
    );
  if (property === "overflow")
    return (
      <Diagram>
        {frame}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M9 ${9 + i * 7}h${value === "visible" ? 38 : value === "auto" ? 25 : 30}`}
            strokeWidth="2"
          />
        ))}
        {value === "auto" && <path d="M39 8v16m0-11v6" strokeWidth="3" />}
        {value === "clip" && <path d="m40 5 4 4m-4-4-4 4" />}
      </Diagram>
    );
  if (property === "objectFit" || property === "backgroundSize") {
    const contain = value === "contain" || value === "scale-down";
    const natural = value === "auto" || value === "none";
    return (
      <Diagram>
        {frame}
        <rect
          x={natural ? 12 : 7}
          y={contain || natural ? 9 : 6}
          width={natural ? 24 : 34}
          height={contain || natural ? 14 : 20}
          rx="1"
          fill="currentColor"
          fillOpacity=".12"
        />
        <path
          d={
            contain || natural
              ? "m12 21 8-9 6 6 4-4 7 7Z"
              : "m7 25 12-17 10 12 6-9 6 14Z"
          }
          fill="currentColor"
          fillOpacity=".5"
        />
        <circle cx="34" cy={contain ? 12 : 9} r="2" fill="currentColor" />
      </Diagram>
    );
  }
  if (property === "objectPosition" || property === "backgroundPosition") {
    const x = value.includes("left") ? 10 : value.includes("right") ? 38 : 24;
    const y =
      value.includes("top") || value === "top"
        ? 8
        : value.includes("bottom") || value === "bottom"
          ? 24
          : 16;
    return (
      <Diagram>
        {frame}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <circle
            key={i}
            cx={10 + (i % 3) * 14}
            cy={8 + Math.floor(i / 3) * 8}
            r="1.2"
            opacity=".25"
          />
        ))}
        <circle cx={x} cy={y} r="4" fill="currentColor" />
      </Diagram>
    );
  }
  if (property === "borderWidth" || property === "borderStyle")
    return (
      <Diagram>
        <rect
          x="8"
          y="5"
          width="32"
          height="22"
          rx="2"
          strokeWidth={
            property === "borderWidth"
              ? value === "0"
                ? 1
                : Math.min(parseFloat(value) || 1, 4)
              : 2
          }
          strokeDasharray={
            value === "dashed"
              ? "5 4"
              : value === "dotted"
                ? "1 4"
                : value === "none" || value === "0"
                  ? "2 4"
                  : undefined
          }
          opacity={value === "none" || value === "0" ? 0.4 : 1}
        />
      </Diagram>
    );
  if (property === "opacity")
    return (
      <Diagram>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <rect
            key={i}
            x={7 + (i % 4) * 8}
            y={4 + Math.floor(i / 4) * 8}
            width="8"
            height="8"
            fill="currentColor"
            fillOpacity={i % 2 ? 0.06 : 0.18}
            stroke="none"
          />
        ))}
        <rect
          x="11"
          y="7"
          width="26"
          height="18"
          rx="2"
          fill="currentColor"
          fillOpacity={
            Number.isFinite(Number(value))
              ? Math.min(1, Math.max(0, Number(value)))
              : 0.5
          }
        />
      </Diagram>
    );
  if (property === "lineHeight")
    return (
      <Diagram>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M12 ${value === "1.2" ? 10 + i * 6 : value === "1.8" ? 5 + i * 11 : 7 + i * 9}h26`}
            strokeWidth="2"
          />
        ))}
        {arrow(6, 6, 6, 26)}
      </Diagram>
    );
  if (property === "letterSpacing")
    return (
      <Diagram>
        <text
          x={value.startsWith("-") ? 15 : value === "0" ? 11 : 6}
          y="24"
          fontSize="22"
          fill="currentColor"
          stroke="none"
        >
          A
        </text>
        <text
          x={value.startsWith("-") ? 25 : value === "0" ? 27 : 31}
          y="24"
          fontSize="22"
          fill="currentColor"
          stroke="none"
        >
          A
        </text>
      </Diagram>
    );
  if (property === "textWrap" || property === "whiteSpace")
    return (
      <Diagram>
        {frame}
        <path
          d={
            value === "nowrap"
              ? "M8 12h36"
              : value === "balance"
                ? "M10 10h28M11 17h26M14 24h20"
                : value === "pretty"
                  ? "M8 10h30M8 17h30M8 24h22"
                  : "M8 10h30M8 17h24M8 24h12"
          }
          strokeWidth="2"
        />
        {property === "whiteSpace" && value !== "normal" && (
          <path d="m36 13 3 3-3 3m3-3h-8" />
        )}
      </Diagram>
    );
  if (property === "backgroundRepeat")
    return (
      <Diagram>
        {frame}
        {value === "repeat"
          ? [0, 1, 2, 3, 4, 5].map((i) =>
              block(8 + (i % 3) * 12, 7 + Math.floor(i / 3) * 12, 8, 8, i)
            )
          : block(17, 9, 14, 14)}
      </Diagram>
    );
  if (property === "position")
    return (
      <Diagram>
        {frame}
        {block(9, 7, 30, 4)}
        {block(9, 21, 30, 4)}
        {value === "static" ? (
          block(9, 14, 30, 4)
        ) : value === "relative" ? (
          <>
            {block(12, 14, 20, 5)}
            {arrow(31, 17, 40, 17)}
          </>
        ) : value === "absolute" ? (
          <>
            {block(20, 11, 22, 12)}
            <path d="M20 11v12" />
          </>
        ) : (
          <>
            <rect
              x="10"
              y={value === "sticky" ? 5 : 10}
              width="28"
              height="9"
              rx="2"
              fill="currentColor"
              fillOpacity=".35"
            />
            <path d="M24 6v8m-3-5 3-3 3 3" />
            {value === "fixed" && <circle cx="40" cy="25" r="2" />}
          </>
        )}
      </Diagram>
    );
  if (property === "zIndex")
    return (
      <Diagram>
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={8 + i * 6}
            y={3 + i * 6}
            width="25"
            height="16"
            rx="2"
            fill={i === 2 && value !== "auto" ? "currentColor" : "white"}
            fillOpacity={i === 2 && value !== "auto" ? 0.3 : 1}
          />
        ))}
      </Diagram>
    );
  if (property === "transform")
    return (
      <Diagram>
        <rect
          x="11"
          y="6"
          width="26"
          height="20"
          rx="2"
          strokeDasharray="2 3"
          opacity=".3"
        />
        <rect
          x="11"
          y="6"
          width="26"
          height="20"
          rx="2"
          fill="currentColor"
          fillOpacity=".2"
          transform={
            value.includes("-")
              ? "rotate(-12 24 16)"
              : value.includes("rotate")
                ? "rotate(12 24 16)"
                : value.includes(".95")
                  ? "translate(3 2) scale(.88)"
                  : value.includes("1.05")
                    ? "translate(-3 -2) scale(1.12)"
                    : undefined
          }
        />
      </Diagram>
    );
  if (property === "cursor")
    return (
      <Diagram>
        <path
          d={
            value === "pointer"
              ? "M18 25V12a3 3 0 0 1 6 0v7-12a3 3 0 0 1 6 0v12-6a3 3 0 0 1 6 0v8l-4 8H21l-8-9a3 3 0 0 1 4-4l7 7"
              : "M16 3v24l7-7 6 9 4-3-6-8h11Z"
          }
        />
      </Diagram>
    );
  return (
    <Diagram>
      {frame}
      {block(12, 10, 24, 12)}
      <path d="m19 13-3 3 3 3m10-6 3 3-3 3" />
    </Diagram>
  );
}
