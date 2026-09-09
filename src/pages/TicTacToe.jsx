import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Sparkles, User, Heart } from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { supabase, isConfigured } from '../lib/supabase';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

const INITIAL_BOARD = Array(9).fill('');

export function TicTacToe() {
  const { user, partnerProfile, isDemo } = useAuth();
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [currentTurn, setCurrentTurn] = useState('X');
  const [winner, setWinner] = useState(null); // 'X', 'O', 'draw', or null
  const [winningLine, setWinningLine] = useState(null);
  const [scores, setScores] = useState({ x: 0, o: 0, draws: 0 });
  const [syncing, setSyncing] = useState(false);

  // In our 2-person game:
  // User A (or first user) is 'X', User B (partner) is 'O'
  // When in live Supabase, if user.id is alphabetical smaller, they are X, else O
  const isPlayerX = isDemo
    ? user?.id === '00000000-0000-0000-0000-000000000001'
    : true; // Default current player to X or dynamically assign

  const partnerName = partnerProfile?.display_name || user?.partnerName || 'Partner';
  const mySymbol = isPlayerX ? 'X' : 'O';
  const partnerSymbol = isPlayerX ? 'O' : 'X';
  const isMyTurn = currentTurn === mySymbol && !winner;

  // Check victory condition
  const checkWin = useCallback((currentBoard) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every(cell => cell !== '')) {
      return { winner: 'draw', line: null };
    }
    return null;
  }, []);

  // Trigger confetti celebration
  const launchCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#f43f5e', '#fb923c', '#c084fc', '#38bdf8']
      });
    } catch (e) {
      // ignore in headless test
    }
  }, []);

  // Sync state handler
  const applyRemoteState = useCallback((remoteState) => {
    if (!remoteState) return;
    setBoard(remoteState.board || INITIAL_BOARD);
    setCurrentTurn(remoteState.current_turn || 'X');
    setWinner(remoteState.winner || null);
    setWinningLine(remoteState.winning_line || null);

    if (remoteState.winner && remoteState.winner !== 'draw') {
      launchCelebration();
    }
  }, [launchCelebration]);

  // Realtime Supabase Subscription & Initial Load
  useEffect(() => {
    // 1. Live Supabase setup
    if (isConfigured && supabase && !isDemo) {
      const loadInitialGame = async () => {
        setSyncing(true);
        const { data, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('id', 'tictactoe-main')
          .single();

        if (data && !error) {
          applyRemoteState(data);
        }
        setSyncing(false);
      };

      loadInitialGame();

      // Listen to postgres changes on game_state
      const channel = supabase
        .channel('public:game_state')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.tictactoe-main' },
          (payload) => {
            applyRemoteState(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // 2. Demo Mode setup: synchronize via BroadcastChannel and localStorage
    if (isDemo) {
      const saved = localStorage.getItem('ourspace_demo_tictactoe');
      if (saved) {
        try {
          applyRemoteState(JSON.parse(saved));
        } catch (e) {}
      }

      const bc = new BroadcastChannel('ourspace_tictactoe_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'GAME_UPDATE') {
          applyRemoteState(event.data.state);
        }
      };

      return () => {
        bc.close();
      };
    }
  }, [isDemo, applyRemoteState]);

  // Handle cell click
  const handleCellClick = async (index) => {
    // Cannot play if cell filled or game finished
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentTurn;
    const nextTurn = currentTurn === 'X' ? 'O' : 'X';
    const winResult = checkWin(newBoard);

    const newState = {
      board: newBoard,
      current_turn: nextTurn,
      winner: winResult?.winner || null,
      winning_line: winResult?.line || null,
      updated_at: new Date().toISOString()
    };

    // Update local state immediately
    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    setWinner(winResult?.winner || null);
    setWinningLine(winResult?.line || null);

    if (winResult?.winner && winResult.winner !== 'draw') {
      launchCelebration();
      setScores(s => ({ ...s, [winResult.winner.toLowerCase()]: s[winResult.winner.toLowerCase()] + 1 }));
    } else if (winResult?.winner === 'draw') {
      setScores(s => ({ ...s, draws: s.draws + 1 }));
    }

    // Broadcast or update Supabase
    if (isConfigured && supabase && !isDemo) {
      await supabase
        .from('game_state')
        .update({
          board: newBoard,
          current_turn: nextTurn,
          winner: winResult?.winner || null,
          winning_line: winResult?.line || null,
          updated_by: user.id
        })
        .eq('id', 'tictactoe-main');
    } else {
      // Demo mode sync
      localStorage.setItem('ourspace_demo_tictactoe', JSON.stringify(newState));
      const bc = new BroadcastChannel('ourspace_tictactoe_channel');
      bc.postMessage({ type: 'GAME_UPDATE', state: newState });
      bc.close();
    }
  };

  // Reset / Play Again
  const handleReset = async () => {
    const freshState = {
      board: INITIAL_BOARD,
      current_turn: 'X',
      winner: null,
      winning_line: null,
      updated_at: new Date().toISOString()
    };

    setBoard(INITIAL_BOARD);
    setCurrentTurn('X');
    setWinner(null);
    setWinningLine(null);

    if (isConfigured && supabase && !isDemo) {
      await supabase
        .from('game_state')
        .update({
          board: INITIAL_BOARD,
          current_turn: 'X',
          winner: null,
          winning_line: null,
          updated_by: user.id
        })
        .eq('id', 'tictactoe-main');
    } else {
      localStorage.setItem('ourspace_demo_tictactoe', JSON.stringify(freshState));
      const bc = new BroadcastChannel('ourspace_tictactoe_channel');
      bc.postMessage({ type: 'GAME_UPDATE', state: freshState });
      bc.close();
    }
  };

  return (
    <div>
      <Header title="Play Room" showBack />

      {/* Game Card */}
      <div className="cozy-card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        {/* Turn & Status Banner */}
        <div style={{
          background: winner
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            : currentTurn === 'X'
            ? 'var(--primary-subtle)'
            : '#eff6ff',
          padding: '0.85rem 1rem',
          borderRadius: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          border: '1.5px solid',
          borderColor: winner ? '#fcd34d' : currentTurn === 'X' ? 'var(--border-light)' : '#bfdbfe'
        }}>
          {winner ? (
            winner === 'draw' ? (
              <span style={{ fontWeight: 700, color: '#92400e' }}>It's a cute draw! Hug it out 🤗</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#92400e' }}>
                <Trophy size={18} color="#d97706" />
                <span>Player {winner} wins! 🎉</span>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: currentTurn === 'X' ? 'var(--primary)' : '#3b82f6'
              }} />
              <span style={{ fontWeight: 700 }}>
                {currentTurn === 'X' ? `${user?.displayName || 'Player 1'} (X)'s turn` : `${partnerName} (O)'s turn`}
              </span>
            </div>
          )}
        </div>

        {/* Players Pill Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            background: currentTurn === 'X' && !winner ? 'var(--primary-light)' : 'transparent',
            fontWeight: currentTurn === 'X' ? 700 : 500
          }}>
            <span>{user?.avatar || '🐻'}</span>
            <span>{user?.displayName || 'You'} (X)</span>
          </div>

          <span style={{ color: 'var(--text-muted)' }}>vs</span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            background: currentTurn === 'O' && !winner ? '#dbeafe' : 'transparent',
            fontWeight: currentTurn === 'O' ? 700 : 500
          }}>
            <span>{partnerProfile?.avatar_emoji || user?.partnerAvatar || '🐰'}</span>
            <span>{partnerName} (O)</span>
          </div>
        </div>

        {/* 3x3 Tic Tac Toe Grid */}
        <div className="tictactoe-grid" style={{ maxWidth: '320px', margin: '0 auto 1.5rem auto' }}>
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            return (
              <button
                key={idx}
                id={`cell-${idx}`}
                disabled={Boolean(cell || winner)}
                onClick={() => handleCellClick(idx)}
                className={`tictactoe-cell ${isWinningCell ? 'winning-cell' : ''} ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : ''}`}
                aria-label={`Cell ${idx + 1}: ${cell || 'Empty'}`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <button
          id="btn-play-again"
          onClick={handleReset}
          className="btn-secondary"
          style={{ maxWidth: '240px', margin: '0 auto' }}
        >
          <RotateCcw size={16} />
          <span>{winner ? 'Play Again' : 'Reset Board'}</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        ⚡ Realtime sync active • Every tap updates instantly for both
      </div>
    </div>
  );
}
