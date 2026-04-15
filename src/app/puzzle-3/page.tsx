"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_NAME, loadBirthdayName } from "@/lib/birthday-content";

type Node = {
  id: number;
  x: number;
  y: number;
};

type Edge = [number, number];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const NODE_RADIUS = 8;

// Generate a proper planar graph puzzle with nodes connected to multiple other nodes
function generatePlanarGraphPuzzle(numNodes: number = 10): { nodes: Node[]; edges: Edge[] } {
  // Start with nodes positioned deterministically
  const initialNodes: Node[] = Array.from({ length: numNodes }, (_, i) => {
    const angle = (i / numNodes) * Math.PI * 2;
    const x = CANVAS_WIDTH / 2 + Math.cos(angle) * (CANVAS_WIDTH * 0.28);
    const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * (CANVAS_HEIGHT * 0.28);
    return { id: i, x, y };
  });

  // Create edges - ensure connectivity with multiple connections per node
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  const nodeConnections = Array.from({ length: numNodes }, () => 0);

  // Create a connected graph ensuring each node has 2-3 connections
  for (let i = 0; i < numNodes; i++) {
    const targetConnections = 2 + Math.floor(Math.random() * 2); // 2 or 3

    while (nodeConnections[i] < targetConnections) {
      let targetNode = Math.floor(Math.random() * numNodes);

      if (targetNode !== i) {
        const a = Math.min(i, targetNode);
        const b = Math.max(i, targetNode);
        const key = `${a}-${b}`;

        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([a, b]);
          nodeConnections[i]++;
          nodeConnections[targetNode]++;
        }
      }
    }
  }

  // Shuffle nodes to create puzzle state with crossings
  const puzzleNodes = initialNodes.map((node) => ({
    ...node,
    x: Math.random() * (CANVAS_WIDTH - NODE_RADIUS * 4) + NODE_RADIUS * 2,
    y: Math.random() * (CANVAS_HEIGHT - NODE_RADIUS * 4) + NODE_RADIUS * 2,
  }));

  return { nodes: puzzleNodes, edges };
}

// Check if two line segments intersect (using CCW method)
function doSegmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }): boolean => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

// Check if any edges intersect
function hasIntersections(nodes: Node[], edges: Edge[]): boolean {
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const [a1, a2] = edges[i];
      const [b1, b2] = edges[j];

      // Skip if edges share a node
      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        continue;
      }

      if (doSegmentsIntersect(nodes[a1], nodes[a2], nodes[b1], nodes[b2])) {
        return true;
      }
    }
  }
  return false;
}

// Get intersection count for display purposes
function getIntersectionCount(nodes: Node[], edges: Edge[]): number {
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const [a1, a2] = edges[i];
      const [b1, b2] = edges[j];

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        continue;
      }

      if (doSegmentsIntersect(nodes[a1], nodes[a2], nodes[b1], nodes[b2])) {
        count++;
      }
    }
  }
  return count;
}

export default function PuzzleThreePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [birthdayName, setBirthdayName] = useState(DEFAULT_NAME);
  const [intersectionCount, setIntersectionCount] = useState(0);
  const solvedSequenceStartedRef = useRef(false);
  const popupTimerRef = useRef<number | null>(null);

  const startNewPuzzle = () => {
    const puzzle = generatePlanarGraphPuzzle(10);
    setNodes(puzzle.nodes);
    setInitialNodes(puzzle.nodes.map((node) => ({ ...node })));
    setEdges(puzzle.edges);
    setDraggingNode(null);
    setIsSolved(false);
    setShowSuccessPopup(false);
    setIntersectionCount(0);
    solvedSequenceStartedRef.current = false;
    if (popupTimerRef.current !== null) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
  };

  // Initialize puzzle
  useEffect(() => {
    startNewPuzzle();
  }, []);

  // Load birthday name
  useEffect(() => {
    let isMounted = true;

    void loadBirthdayName().then((loadedName) => {
      if (isMounted) {
        setBirthdayName(loadedName);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Prefetch next page
  useEffect(() => {
    void router.prefetch("/letter");
  }, [router]);

  useEffect(() => {
    return () => {
      if (popupTimerRef.current !== null) {
        window.clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }
    };
  }, []);

  // Check if solved and update intersection count
  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return;

    const intersectCount = getIntersectionCount(nodes, edges);
    setIntersectionCount(intersectCount);

    const hasIntersect = intersectCount > 0;
    const newIsSolved = !hasIntersect;

    if (newIsSolved && !isSolved && !solvedSequenceStartedRef.current) {
      solvedSequenceStartedRef.current = true;
      setIsSolved(true);
    }
  }, [nodes, edges, isSolved]);

  useEffect(() => {
    if (!isSolved || showSuccessPopup) {
      return;
    }

    if (popupTimerRef.current !== null) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }

    popupTimerRef.current = window.setTimeout(() => {
      setShowSuccessPopup(true);
      popupTimerRef.current = null;
    }, 300);
  }, [isSolved, showSuccessPopup]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0e27";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw edges
    edges.forEach(([a, b]) => {
      const nodeA = nodes[a];
      const nodeB = nodes[b];
      if (!nodeA || !nodeB) return;

      // Check if this edge intersects with any other edge
      let edgeHasIntersection = false;
      for (let i = 0; i < edges.length; i++) {
        const [c, d] = edges[i];
        if (c === a || c === b || d === a || d === b) continue;
        if (doSegmentsIntersect(nodeA, nodeB, nodes[c], nodes[d])) {
          edgeHasIntersection = true;
          break;
        }
      }

      ctx.strokeStyle = edgeHasIntersection ? "#ef4444" : "#60a5fa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node, idx) => {
      ctx.fillStyle = draggingNode === idx ? "#fbbf24" : isSolved ? "#22c55e" : "#e2e8f0";
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [nodes, edges, draggingNode, isSolved]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isSolved) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find node at click position
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist <= NODE_RADIUS + 5) {
        setDraggingNode(i);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingNode === null || isSolved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(NODE_RADIUS, Math.min(CANVAS_WIDTH - NODE_RADIUS, e.clientX - rect.left));
    const y = Math.max(NODE_RADIUS, Math.min(CANVAS_HEIGHT - NODE_RADIUS, e.clientY - rect.top));

    setNodes((prev) =>
      prev.map((node, idx) => (idx === draggingNode ? { ...node, x, y } : node))
    );
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const goToNextPage = () => {
    router.push("/letter");
  };

  const resetCurrentPuzzle = () => {
    if (initialNodes.length === 0) return;

    setNodes(initialNodes.map((node) => ({ ...node })));
    setDraggingNode(null);
    setIsSolved(false);
    setShowSuccessPopup(false);
    solvedSequenceStartedRef.current = false;
    if (popupTimerRef.current !== null) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
  };

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "grid",
        placeItems: "center",
        padding: "1.2rem",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "700px",
          borderRadius: "1.6rem",
          padding: "clamp(1rem, 2vw, 2rem)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(11, 16, 34, 0.72)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 28px 68px rgba(2, 6, 23, 0.58)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1
            style={{
              margin: 0,
              color: "#e2e8f0",
              fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              fontWeight: 900,
            }}
          >
            Puzzle 3: Untangle
          </h1>
          <p
            style={{
              margin: "0.65rem auto 0",
              maxWidth: "42rem",
              color: "#cbd5e1",
              fontSize: "clamp(0.98rem, 1.7vw, 1.15rem)",
              lineHeight: 1.45,
              textWrap: "balance",
            }}
          >
            Untangle these nodes so that no lines intersect each other.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            placeItems: "center",
            marginBottom: "1.2rem",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              borderRadius: "0.8rem",
              border: "2px solid rgba(96, 165, 250, 0.3)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              cursor: draggingNode !== null ? "grabbing" : "grab",
              backgroundColor: "#0a0e27",
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#cbd5e1",
              fontSize: "0.9rem",
            }}
          >
            {isSolved ? (
              <p style={{ color: "#22c55e", fontWeight: 600, margin: 0 }}>✓ Puzzle solved!</p>
            ) : (
              <p style={{ margin: 0 }}>Drag the nodes to untangle the graph...</p>
            )}
          </div>
          {!isSolved && (
            <div
              style={{
                padding: "0.4rem 0.8rem",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "0.5rem",
                color: "#fca5a5",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              {intersectionCount} crossing{intersectionCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.75rem",
            marginTop: "0.25rem",
            marginBottom: "0.35rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={resetCurrentPuzzle}
            style={{
              border: "1px solid rgba(148, 163, 184, 0.45)",
              background: "rgba(51, 65, 85, 0.4)",
              color: "#e2e8f0",
              fontWeight: 600,
              borderRadius: "0.6rem",
              padding: "0.55rem 1rem",
              cursor: "pointer",
              fontSize: "0.92rem",
              transition: "all 180ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(71, 85, 105, 0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(51, 65, 85, 0.4)";
            }}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={startNewPuzzle}
            style={{
              border: "1px solid rgba(96, 165, 250, 0.65)",
              background: "rgba(37, 99, 235, 0.18)",
              color: "#bfdbfe",
              fontWeight: 700,
              borderRadius: "0.6rem",
              padding: "0.55rem 1rem",
              cursor: "pointer",
              fontSize: "0.92rem",
              transition: "all 180ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(37, 99, 235, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(37, 99, 235, 0.18)";
            }}
          >
            Try Another
          </button>
        </div>

        {showSuccessPopup ? (
          <div
            role="dialog"
            aria-live="polite"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              display: "grid",
              placeItems: "center",
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
                borderRadius: "1.2rem",
                padding: "2rem",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                maxWidth: "90vw",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.8rem",
                  color: "#fbbf24",
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Congratulations
              </p>
              <p
                style={{
                  margin: "0 0 1.5rem",
                  color: "#e2e8f0",
                  fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                  lineHeight: 1.6,
                  textWrap: "balance",
                }}
              >
                {`Congratulations, ${birthdayName}. You finally made it across all my games. I think it's now time for you to receive my treasure.`}
              </p>
              <p
                style={{
                  margin: "0 0 1.5rem",
                  color: "#cbd5e1",
                  fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                  lineHeight: 1.6,
                }}
              >
                Ready to open your letter?
              </p>
              <button
                type="button"
                onClick={goToNextPage}
                style={{
                  width: "100%",
                  border: "1px solid rgba(251, 191, 36, 0.65)",
                  background: "rgba(251, 191, 36, 0.14)",
                  color: "#fde68a",
                  fontWeight: 700,
                  borderRadius: "0.7rem",
                  padding: "0.8rem 1.2rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                  textAlign: "center",
                  lineHeight: 1.2,
                  transition: "all 220ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(251, 191, 36, 0.25)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(251, 191, 36, 0.14)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Go To Your Prize
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
