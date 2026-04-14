import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

export type BoardPiece = {
  color: Color;
  type: PieceSymbol;
  square: Square;
};

export type PromotionChoice = "q" | "r" | "b" | "n";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function createGame(fen?: string): Chess {
  return fen ? new Chess(fen) : new Chess();
}

export function getAllSquares(): Square[] {
  const squares: Square[] = [];

  for (let rank = 8; rank >= 1; rank -= 1) {
    for (let file = 0; file < 8; file += 1) {
      squares.push(`${FILES[file]}${rank}` as Square);
    }
  }

  return squares;
}

export function getBoardPieces(game: Chess): BoardPiece[] {
  const pieces: BoardPiece[] = [];
  const board = game.board();

  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      const piece = board[y][x];
      if (!piece) {
        continue;
      }

      const square = `${FILES[x]}${8 - y}` as Square;
      pieces.push({ color: piece.color, type: piece.type, square });
    }
  }

  return pieces;
}

export function getLegalMovesFrom(game: Chess, square: Square): Square[] {
  const moves = game.moves({ square, verbose: true });
  return moves.map((move) => move.to as Square);
}

export function isDarkSquare(square: Square): boolean {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return (file + rank) % 2 === 1;
}

export function toSpriteClass(piece: BoardPiece): string {
  const colorClass = piece.color === "w" ? "white" : "black";
  const pieceClassMap: Record<PieceSymbol, string> = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "castle",
    q: "queen",
    k: "king",
  };

  return `${colorClass}-${pieceClassMap[piece.type]}`;
}

export function getTurnLabel(game: Chess): string {
  return game.turn() === "w" ? "White" : "Black";
}

export function getStatusText(game: Chess): string {
  if (game.isCheckmate()) {
    return `Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`;
  }

  if (game.isStalemate()) {
    return "Stalemate.";
  }

  if (game.isDraw()) {
    return "Draw.";
  }

  if (game.isCheck()) {
    return `${game.turn() === "w" ? "White" : "Black"} is in check.`;
  }

  return `${getTurnLabel(game)} to move.`;
}

export function requiresPromotion(game: Chess, from: Square, to: Square): boolean {
  const piece = game.get(from);
  if (!piece || piece.type !== "p") {
    return false;
  }

  return to.endsWith("1") || to.endsWith("8");
}
