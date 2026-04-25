import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useAxios } from "../shared/hooks/useAxios";

/**
 * Singleton AudioContext — browsers limit the number of AudioContext instances
 * and will silently fail if you create too many. We reuse one across all plays.
 */
let sharedAudioCtx = null;

function getAudioContext() {
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
        sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return sharedAudioCtx;
}

/**
 * Plays a two-tone notification chime using the Web Audio API.
 * Generated programmatically — no audio file needed, zero copyright concerns.
 *
 * Handles the browser autoplay policy by resuming a suspended AudioContext
 * before scheduling tones. Uses a singleton context to avoid hitting browser
 * limits on concurrent AudioContext instances.
 */
async function playNotificationSound() {
    try {
        const audioCtx = getAudioContext();

        // Browsers suspend the AudioContext until a user gesture has occurred.
        // When polling in the background this is the #1 reason sounds go missing.
        // Calling resume() is safe to call multiple times and is a no-op if
        // the context is already running.
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }

        const now = audioCtx.currentTime;

        // --- Tone 1: 800 Hz for 200ms ---
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(800, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(1.0, now + 0.02);
        gain1.gain.linearRampToValueAtTime(0, now + 0.2);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // --- Tone 2: 1000 Hz for 250ms (starts after tone 1) ---
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1000, now + 0.25);
        gain2.gain.setValueAtTime(0, now + 0.25);
        gain2.gain.linearRampToValueAtTime(1.0, now + 0.27);
        gain2.gain.linearRampToValueAtTime(0, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.25);
        osc2.stop(now + 0.5);

        // --- Tone 3: 1200 Hz for 300ms (final rising note) ---
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.type = "sine";
        osc3.frequency.setValueAtTime(1200, now + 0.55);
        gain3.gain.setValueAtTime(0, now + 0.55);
        gain3.gain.linearRampToValueAtTime(0.9, now + 0.57);
        gain3.gain.linearRampToValueAtTime(0, now + 0.85);
        osc3.connect(gain3);
        gain3.connect(audioCtx.destination);
        osc3.start(now + 0.55);
        osc3.stop(now + 0.85);
    } catch (err) {
        console.warn("Could not play notification sound:", err);
    }
}

/**
 * Hook that polls the backend every 10s to detect new orders.
 * When a new order is detected, plays a notification sound and
 * auto-refreshes the store dashboard data.
 *
 * The hook lives in StoreLayout so it runs regardless of which
 * dashboard tab is active.
 */
export const useNewOrderNotification = () => {
    const { api } = useAxios();
    const queryClient = useQueryClient();
    const isInitialLoadRef = useRef(true);
    const knownOrderIdsRef = useRef(new Set());

    // ── Warm up AudioContext on first user interaction ──────────────
    // Browsers require a user gesture before an AudioContext can play.
    // We eagerly create + resume the context on the very first click/tap/keypress
    // so that later, when a new order arrives (possibly while the user is on
    // another tab), the context is already unlocked and sound plays immediately.
    useEffect(() => {
        const unlock = () => {
            try {
                const ctx = getAudioContext();
                if (ctx.state === "suspended") {
                    ctx.resume();
                }
            } catch {
                // ignore — worst case we retry on next interaction
            }
        };

        window.addEventListener("click", unlock, { once: false, capture: true });
        window.addEventListener("keydown", unlock, { once: false, capture: true });
        window.addEventListener("touchstart", unlock, { once: false, capture: true });

        return () => {
            window.removeEventListener("click", unlock, { capture: true });
            window.removeEventListener("keydown", unlock, { capture: true });
            window.removeEventListener("touchstart", unlock, { capture: true });
        };
    }, []);

    const { data } = useQuery({
        queryKey: ["store", "new-order-check"],
        queryFn: async () => {
            const response = await api.get("/store/new-order-check/");
            return response.data;
        },
        refetchInterval: 10000, // Poll every 10 seconds
        refetchIntervalInBackground: true, // Keep polling even when tab is in background
        staleTime: 5000,
    });

    const handleNewOrder = useCallback(() => {
        playNotificationSound();
        // Invalidate ALL store queries so dashboard automatically refreshes,
        // regardless of active filters or pagination.
        queryClient.invalidateQueries({ queryKey: ["store"] });
    }, [queryClient]);

    useEffect(() => {
        if (!data || !Array.isArray(data.active_order_ids)) return;

        // On initial load, silently add all existing active orders to our known set
        if (isInitialLoadRef.current) {
            data.active_order_ids.forEach(id => knownOrderIdsRef.current.add(id));
            isInitialLoadRef.current = false;
            return;
        }

        let hasNewOrder = false;

        // Check each newly fetched order ID to see if we've seen it before in this session
        data.active_order_ids.forEach(id => {
            if (!knownOrderIdsRef.current.has(id)) {
                hasNewOrder = true;
                knownOrderIdsRef.current.add(id);
            }
        });

        if (hasNewOrder) {
            handleNewOrder();
        }
    }, [data, handleNewOrder]);
};
