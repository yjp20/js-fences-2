import React, { useEffect, useState } from "react";

const config = {
  "2-13": 6,
  "3-6": 1,
  "3-15": 19,
  "4-9": 6,
  "9-7": 8,
  "7-10": 38,
  "9-11": 6,
  "5-17": 6,
  "11-8": 4,
  "13-1": 7,
  "15-3": 3,
  "14-9": 3,
  "14-9": 3,
  "16-5": 6,
  "15-12": 11,
};

const DIRS = [
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
];

function toHex(x, y) {
  return [x + y * 0.5, y * Math.sqrt(3)];
}

function d(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}

function closestDir(dx, dy) {
  const dots = DIRS.map(
    (dir) =>
      d(...toHex(dx, dy), ...toHex(...dir)) /
      d(...toHex(...dir), ...toHex(...dir))
  );

  let idx = -1;
  let best = 0;
  for (let i = 0; i < dots.length; i++) {
    if (dots[i] > 0 && dots[i] > best) {
      idx = i;
      best = dots[i];
    }
  }

  return { idx, len: Math.round(best) };
}

function togglePaths({ path, idx, len, x, y }) {
  const entries = [];
  for (let i = 0; i < len; i++) {
    const nextX = x + DIRS[idx][0];
    const nextY = y + DIRS[idx][1];
    entries.push([`${nextX}-${nextY}`, `${x}-${y}`].sort().join());

    x = nextX;
    y = nextY;
  }
  return Object.fromEntries(entries.map((entry) => [entry, !path[entry]]));
}

function getColor(x, y) {
  const r1 = x + y > 18;
  const nr1 = x + y < 18;

  const r2 = x > 9;
  const nr2 = x < 9;

  const r3 = y > 9;
  const nr3 = y < 9;

  return [
    nr1 && nr2 && !nr3 ? "purple" : null,
    nr1 && !r2 && nr3 ? "cyan" : null,
    !r1 && r2 && nr3 ? "green" : null,
    !nr1 && nr2 && r3 ? "red" : null,
    !nr1 && !nr2 && r3 ? "orange" : null,
    r1 && r2 && !r3 ? "yellow" : null,
    "white",
  ].find((value) => value);
}

let j;
try {
  j = JSON.parse(localStorage.getItem("state") ?? "{}");
} catch (e) {}

const HexagonalGrid = ({ width = 19, height = 19 }) => {
  const hexSize = 30;
  const hexWidth = Math.floor(hexSize * Math.sqrt(3));
  const hexHeight = Math.floor(2 * hexSize);
  const verticalSpacing = Math.floor(hexHeight * 0.75);

  const [connected, setConnected] = useState(j?.connected ?? {});
  const [path, setPath] = useState(j.path ?? {});
  const [mouseDown, setMouseDown] = useState(null);

  useEffect(() => {
    localStorage.setItem("state", JSON.stringify({ connected, path }));
  }, [connected, path]);

  const gridWidth = width * hexWidth;
  const gridHeight = height * verticalSpacing + hexHeight * 0.25;

  const hexPoints = `
    ${hexWidth / 2},0
    ${hexWidth},${hexHeight / 4}
    ${hexWidth},${(hexHeight * 3) / 4}
    ${hexWidth / 2},${hexHeight}
    0,${(hexHeight * 3) / 4}
    0,${hexHeight / 4}
  `.trim();

  const hexagons = [];
  const lines = [];

  function resetMouseDown() {
    if (mouseDown) {
      setConnected(() => {
        return mouseDown.connected;
      });
      setPath(() => {
        return mouseDown.path;
      });
      setMouseDown(null);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y + x < 9 || y + x > 27) continue;

      const centerX = x * hexWidth + (y - 9) * hexWidth * 0.5 + hexSize;
      const centerY = y * verticalSpacing + hexSize;

      const key = `${x}-${y}`;
      hexagons.push(
        <g key={key}>
          <polygon
            points={hexPoints}
            transform={`translate(${centerX - hexWidth / 2}, ${centerY - hexHeight / 2})`}
            fill={getColor(x, y)}
            fillOpacity={0.3}
            stroke="black"
            strokeWidth={mouseDown?.key === key ? 4 : 1}
            data-x={x}
            data-y={y}
          />
          <text
            x={centerX}
            y={centerY}
            pointerEvents="none"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="19"
            fontWeight="bold"
          >
            {config[key]
              ? config[key] -
                Object.values(connected[key] ?? {}).reduce((p, v) => p + v, 0)
              : ""}
          </text>
        </g>
      );

      // Draw connections
      if (connected[key]) {
        Object.entries(connected[key])
          .filter(([_, len]) => len > 0)
          .forEach(([dir, len]) => {
            const [dx, dy] = [DIRS[dir][0], DIRS[dir][1]];
            const endX = centerX + len * (dx * hexWidth + dy * hexWidth * 0.5);
            const endY = centerY + len * (dy * verticalSpacing);

            lines.push(
              <line
                onClick={() => {
                  if (!mouseDown) {
                    setConnected({
                      ...connected,
                      [key]: { ...connected[key], [dir]: 0 },
                    });
                  }
                }}
                key={`${key}-${dir}`}
                x1={centerX + 0.5 * hexWidth * (dx + dy * 0.5) * 0.75}
                y1={centerY + 0.5 * verticalSpacing * dy * 0.75}
                x2={endX}
                y2={endY}
                stroke="black"
                strokeWidth={3}
              />
            );
          });
      }
    }
  }

  const cells = [];
  const pathLines = [];
  for (const [segment] of Object.entries(path).filter(([_, val]) => val)) {
    const [start, end] = segment.split(",");
    if (!start || !end) continue;
    const [sx, sy] = start.split("-");
    const [ex, ey] = end.split("-");
    const [ssx, ssy] = [Number(sx), Number(sy)];
    const [eex, eey] = [Number(ex), Number(ey)];
    cells.push({ x: ssx, y: ssy }, { x: eex, y: eey });
    pathLines.push(
      <line
        onClick={() => {
          if (!mouseDown) {
            setPath({
              ...path,
              [segment]: false,
            });
          }
        }}
        key={segment}
        x1={(ssx + ssy / 2) * hexWidth - (9 * hexWidth) / 2 + hexSize}
        y1={ssy * verticalSpacing + hexSize}
        x2={(eex + eey / 2) * hexWidth - (9 * hexWidth) / 2 + hexSize}
        y2={eey * verticalSpacing + hexSize}
        stroke="red"
        strokeWidth={3}
      />
    );
  }

  const handleMouseDown = (e) => {
    let x = e.target.getAttribute("data-x");
    let y = e.target.getAttribute("data-y");
    if (!x || !y) return;
    x = Number(x);
    y = Number(y);

    if (!mouseDown) {
      const key = `${x}-${y}`;
      setMouseDown({
        x,
        y,
        connected,
        path,
        key,
        pathMode: !Boolean(config[key]),
      });
    } else if (mouseDown.pathMode) {
      const { idx, len } = closestDir(x - mouseDown.x, y - mouseDown.y);
      setPath(() => ({
        ...mouseDown.path,
        ...togglePaths({ ...mouseDown, idx, len }),
      }));
      setMouseDown(null);
    } else {
      const { idx, len } = closestDir(x - mouseDown.x, y - mouseDown.y);
      setConnected(() => ({
        ...mouseDown.connected,
        [mouseDown.key]:
          idx === -1
            ? undefined //
            : { ...mouseDown.connected[mouseDown.key], [idx]: len },
      }));
      setMouseDown(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!mouseDown) return;

    let x = e.target.getAttribute("data-x");
    let y = e.target.getAttribute("data-y");
    if (!x || !y) return;
    x = Number(x);
    y = Number(y);

    if (mouseDown.pathMode) {
      const { idx, len } = closestDir(x - mouseDown.x, y - mouseDown.y);
      return {
        ...mouseDown.path,
        ...togglePaths({ ...mouseDown, idx, len }),
      };
    } else {
      const { idx, len } = closestDir(x - mouseDown.x, y - mouseDown.y);
      if (idx >= 0) {
        setConnected(() => ({
          ...mouseDown.connected,
          [mouseDown.key]: {
            ...mouseDown.connected[mouseDown.key],
            [idx]: len,
          },
        }));
      }
    }
  };

  const counts = cells
    .map((cell) => getColor(cell.x, cell.y))
    .reduce((count, element) => {
      const key = String(element);
      count[key] = (count[key] || 0) + 1;
      return count;
    }, {});

  return (
    <>
      <div style={{ width: 200 }}>
        {Object.entries(counts).map(([k, v]) => (
          <p>{`${k}: ${v / 2}`}</p>
        ))}
        <p>
          {Object.values(counts)
            .map((v) => v / 2)
            .reduce((prev, item) => prev * item, 1)}
        </p>
        <button
          onClick={() => {
            resetMouseDown();
            setConnected({});
          }}
        >
          Clear fences
        </button>
        <button
          onClick={() => {
            resetMouseDown();
            setPath({});
          }}
        >
          Clear path
        </button>
      </div>
      <svg
        width={gridWidth}
        height={gridHeight}
        onClick={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {hexagons}
        {lines}
        {pathLines}
      </svg>
    </>
  );
};

export default HexagonalGrid;
