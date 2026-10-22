import React from 'react';
import { GHOST_HOOD_PATH, GHOST_FACE_PATH } from './ghostMask.ts';

const { useState, useEffect, useRef } = React;

// --- Bingo celebration: one random effect, then a spider drops in with a swinging BINGO sign ---

type EffectName = 'alive' | 'candy' | 'ghost' | 'conga';
const EFFECTS: EffectName[] = ['alive', 'candy', 'ghost', 'conga'];

interface FxContext {
    layer: HTMLDivElement;
    cells: HTMLElement[];      // the winning cells, in order
    running: boolean;          // false once the celebration unmounts; loops stop on it
    timers: number[];
    animations: Animation[];
    cleanups: (() => void)[];
}

const later = (ctx: FxContext, fn: () => void, ms: number) => { ctx.timers.push(window.setTimeout(fn, ms)); };

// Runs fn every frame with seconds elapsed until it returns false or the celebration ends.
const loop = (ctx: FxContext, fn: (t: number, dt: number) => boolean | void) => {
    let start: number | null = null, last = 0;
    const step = (now: number) => {
        if (!ctx.running) return;
        start ??= now;
        const t = (now - start) / 1000;
        const keepGoing = fn(t, Math.min(0.033, t - last));
        last = t;
        if (keepGoing !== false) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};

const sprite = (ctx: FxContext, icon: string, size: number) => {
    const el = document.createElement('div');
    el.className = 'celebration-sprite';
    el.style.width = el.style.height = `${size}px`;
    el.innerHTML = `<svg fill="currentColor"><use href="#${icon.replace(/\s/g, '')}"></use></svg>`;
    ctx.layer.appendChild(el);
    return el;
};

const animate = (ctx: FxContext, el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const anim = el.animate(keyframes, options);
    ctx.animations.push(anim);
    return anim;
};

const cellIcon = (cell: HTMLElement, fallback: string) => cell.dataset.icon || fallback;

// Each effect returns how long (ms) to wait before the BINGO sign drops in.
const effects: Record<EffectName, (ctx: FxContext) => number> = {
    // The winning tiles lift off the card, their monsters dance a wave, then settle back glowing.
    alive(ctx) {
        ctx.cells.forEach((cell, i) => {
            cell.style.zIndex = '5';
            const lift = animate(ctx, cell, [{ transform: 'scale(0.95) translateY(0)' }, { transform: 'scale(1.14) translateY(-16px)' }],
                { duration: 350, delay: i * 70, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'forwards' });
            const art = cell.firstElementChild;
            if (art) {
                animate(ctx, art, [
                    { transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-14px) rotate(-14deg)' },
                    { transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-8px) rotate(14deg)' },
                    { transform: 'translateY(0) rotate(0)' },
                ], { duration: 600, delay: 450 + i * 110, iterations: 3, easing: 'ease-in-out' });
            }
            later(ctx, () => {
                lift.cancel();
                animate(ctx, cell, [{ transform: 'scale(1.14) translateY(-16px)' }, { transform: 'scale(0.95) translateY(0)' }],
                    { duration: 400, easing: 'cubic-bezier(.3,1.4,.5,1)' });
                cell.style.boxShadow = '0 0 0 3px #ff9f1c, 0 0 18px 4px rgba(255, 140, 0, 0.7)'; // inline: React rewrites the cell's className
            }, 2700 + i * 60);
            ctx.cleanups.push(() => { cell.style.zIndex = ''; cell.style.boxShadow = ''; });
        });
        return 3100;
    },

    // Sweets burst out of the winning row, bounce off the bottom of the screen and pile up.
    candy(ctx) {
        const treats = ['candy', 'lolli', 'pumpkin', 'candy', 'lolli', 'eyeball'];
        const gravity = 1500;
        const bits = ctx.cells.flatMap((cell, ci) => {
            const r = cell.getBoundingClientRect();
            animate(ctx, cell, [{ transform: 'scale(0.95)' }, { transform: 'scale(1.25)' }, { transform: 'scale(0.95)' }], { duration: 300, delay: ci * 80 });
            return Array.from({ length: 9 }, (_, k) => {
                const size = 26 + Math.random() * 22;
                const el = sprite(ctx, treats[(ci + k) % treats.length], size);
                el.style.opacity = '0';
                return {
                    el, size,
                    x: r.left + r.width / 2 - size / 2, y: r.top + r.height / 2 - size / 2,
                    vx: (Math.random() - 0.5) * 520, vy: -500 - Math.random() * 650,
                    rot: 0, vr: (Math.random() - 0.5) * 900, delay: ci * 0.08 + Math.random() * 0.1,
                };
            });
        });
        loop(ctx, (t, dt) => {
            const w = window.innerWidth, h = window.innerHeight;
            let moving = false;
            bits.forEach(b => {
                if (t < b.delay) return;
                b.el.style.opacity = '1';
                b.vy += gravity * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
                const floor = h - b.size;
                if (b.y > floor) { b.y = floor; b.vy *= -0.45; b.vx *= 0.7; b.vr *= 0.6; if (Math.abs(b.vy) < 40) b.vy = 0; }
                if (b.x < 0 || b.x > w - b.size) { b.vx *= -0.7; b.x = Math.max(0, Math.min(w - b.size, b.x)); }
                if (b.vy !== 0 || Math.abs(b.vx) > 1) moving = true;
                b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.rot}deg)`;
            });
            return moving || t < 1;
        });
        return 1400;
    },

    // Lights out, the ghost mask lunges at the screen with a BOO!, then the lights come back on.
    ghost(ctx) {
        const scare = document.createElement('div');
        scare.className = 'celebration-scare';
        scare.innerHTML = `
            <svg viewBox="0 0 831.0055 1184.8492" class="celebration-scare-mask">
                <path fill="#b2a8c9" d="${GHOST_HOOD_PATH}"></path>
                <path fill="#FCF7E6" d="${GHOST_FACE_PATH}"></path>
            </svg>
            <div class="celebration-scare-boo">BOO!</div>`;
        ctx.layer.appendChild(scare);
        const mask = scare.querySelector('svg')!, boo = scare.querySelector('div')!;
        animate(ctx, scare, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
        later(ctx, () => {
            animate(ctx, mask, [{ transform: 'scale(0.1)', opacity: 0 }, { transform: 'scale(1.6)', opacity: 1, offset: 0.55 }, { transform: 'scale(1.25)', opacity: 1 }],
                { duration: 450, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'forwards' });
            animate(ctx, boo, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: 0.6 }, { transform: 'scale(1)' }],
                { duration: 400, delay: 120, easing: 'ease-out', fill: 'forwards' });
            scare.classList.add('celebration-shake');
        }, 650);
        later(ctx, () => scare.classList.remove('celebration-shake'), 1350);
        later(ctx, () => animate(ctx, scare, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }), 1900);
        return 2100;
    },

    // The winning monsters hop out of their squares and conga-line around the card.
    conga(ctx) {
        const card = document.getElementById('bingo-card')?.getBoundingClientRect();
        if (!card) return 0;
        const cx = card.left + card.width / 2, cy = card.top + card.height / 2;
        const rx = Math.min(card.width / 2 + 12, window.innerWidth / 2 - 28), ry = card.height / 2 + 24;
        const size = Math.min(56, card.width / 7);
        const dancers = ctx.cells.map((cell, i) => {
            const r = cell.getBoundingClientRect();
            const art = cell.firstElementChild as HTMLElement | null;
            if (art) { art.style.opacity = '0.2'; ctx.cleanups.push(() => { art.style.opacity = ''; }); }
            return { el: sprite(ctx, cellIcon(cell, 'pumpkin'), size), x0: r.left + r.width / 2, y0: r.top + r.height / 2, start: i * 0.3, lastX: 0 };
        });
        const speed = 1.7; // radians per second around the loop
        const entry = 0.45; // seconds to hop from the square onto the loop
        loop(ctx, (t) => {
            dancers.forEach(d => {
                const s = t - d.start;
                const angle = -Math.PI / 2 + Math.max(0, s - entry) * speed;
                const px = cx + rx * Math.cos(angle), py = cy + ry * Math.sin(angle);
                let x = d.x0, y = d.y0;
                if (s > 0) {
                    const k = Math.min(1, s / entry);
                    x = d.x0 + (px - d.x0) * k; y = d.y0 + (py - d.y0) * k - Math.sin(k * Math.PI) * 40;
                }
                const hop = s > entry ? Math.abs(Math.sin(t * 9 + d.start * 4)) * 10 : 0;
                const facing = x < d.lastX ? -1 : 1;
                d.lastX = x;
                d.el.style.transform = `translate(${x - size / 2}px, ${y - size / 2 - hop}px) scaleX(${facing}) rotate(${Math.sin(t * 9 + d.start * 4) * 10}deg)`;
            });
        });
        return 2600;
    },
};

interface CelebrationProps {
    isDismissing: boolean;
    onNewGame: () => void;
    onClose: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({ isDismissing, onNewGame, onClose }) => {
    const layerRef = useRef<HTMLDivElement>(null);
    const [showSign, setShowSign] = useState(false);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ctx: FxContext = {
            layer, running: true, timers: [], animations: [], cleanups: [],
            cells: [...document.querySelectorAll<HTMLElement>('#bingo-card [data-winning="true"]')].slice(0, 5),
        };
        // ?celebration=candy (etc.) forces an effect, for demos and testing.
        const requested = new URLSearchParams(window.location.search).get('celebration') as EffectName | null;
        const effect = requested && EFFECTS.includes(requested) ? requested : EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
        const signDelay = reduceMotion || ctx.cells.length === 0 ? 0 : effects[effect](ctx);
        later(ctx, () => setShowSign(true), signDelay);
        return () => {
            ctx.running = false;
            ctx.timers.forEach(clearTimeout);
            ctx.animations.forEach(a => a.cancel());
            ctx.cleanups.forEach(fn => fn());
            layer.innerHTML = '';
        };
    }, []);

    return (
        <div className={`celebration ${isDismissing ? 'is-leaving' : ''}`}>
            <div ref={layerRef} className="celebration-layer" />
            {showSign && (
                <div className="celebration-backdrop" onClick={onClose}>
                    <div className="celebration-drop">
                        <div className="celebration-swing">
                            <div className="celebration-thread" />
                            <svg className="celebration-spider" viewBox="-10 -6 20 22" aria-hidden="true">
                                <g className="celebration-spider-legs">
                                    <line x1="0" y1="5" x2="-8" y2="-1" /><line x1="0" y1="5" x2="8" y2="-1" />
                                    <line x1="0" y1="5" x2="-9" y2="5" /><line x1="0" y1="5" x2="9" y2="5" />
                                    <line x1="0" y1="5" x2="-8" y2="11" /><line x1="0" y1="5" x2="8" y2="11" />
                                    <line x1="0" y1="5" x2="-6" y2="14" /><line x1="0" y1="5" x2="6" y2="14" />
                                </g>
                                <ellipse cx="0" cy="6" rx="4" ry="5.5" /><circle cx="0" cy="-0.5" r="3" />
                                <circle cx="-1.1" cy="-1" r=".7" className="celebration-spider-eye" /><circle cx="1.1" cy="-1" r=".7" className="celebration-spider-eye" />
                            </svg>
                            <div className="celebration-sign" onClick={(e) => e.stopPropagation()}>
                                <h2 className="font-pixel celebration-sign-title">BINGO!</h2>
                                <p className="font-pixel text-lg">You've summoned a win!</p>
                                <div className="flex justify-center gap-3 mt-4">
                                    <button onClick={onNewGame} className="bg-black text-white dark:bg-white dark:text-black font-pixel text-lg py-2 px-5 hover:opacity-90 transition-opacity">
                                        New Game
                                    </button>
                                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-800 font-pixel text-lg py-2 px-5 hover:opacity-90 transition-opacity">
                                        Keep Playing
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
