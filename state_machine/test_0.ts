import type { event, state } from "./state_machine.ts";
import { state_machine } from "./state_machine.ts";
// ============================================================================
// Example: Traffic Light State Machine
// ============================================================================

// Define states
const traffic_light_state = {
    RED: 0,
    YELLOW: 1,
    GREEN: 2,
} as const;

type traffic_light_state_t = typeof traffic_light_state;

interface red_state extends state<typeof traffic_light_state> {
    s_type: typeof traffic_light_state.RED;
    duration: number;
}

interface yellow_state extends state<typeof traffic_light_state> {
    s_type: typeof traffic_light_state.YELLOW;
    duration: number;
}

interface green_state extends state<typeof traffic_light_state> {
    s_type: typeof traffic_light_state.GREEN;
    duration: number;
}

// Define events
const traffic_light_event = {
    TIMER_COMPLETE: 0,
    EMERGENCY: 1,
} as const;

interface timer_complete_event extends event<typeof traffic_light_event> {
    e_type: typeof traffic_light_event.TIMER_COMPLETE;
}

interface emergency_event extends event<typeof traffic_light_event> {
    e_type: typeof traffic_light_event.EMERGENCY;
    vehicle_type: "ambulance" | "fire_truck";
}

// Define transitions
const traffic_light_transitions = {
    [traffic_light_state.RED]: {
        [traffic_light_event.TIMER_COMPLETE]: (
            _state: red_state,
            _event: timer_complete_event,
        ): green_state => {
            console.log("🔴 → 🟢 Red to Green");
            return { s_type: traffic_light_state.GREEN, duration: 30 };
        },
    },
    [traffic_light_state.YELLOW]: {
        [traffic_light_event.TIMER_COMPLETE]: (
            _state: yellow_state,
            _event: timer_complete_event,
        ): red_state => {
            console.log("🟡 → 🔴 Yellow to Red");
            return { s_type: traffic_light_state.RED, duration: 45 };
        },
    },
    [traffic_light_state.GREEN]: {
        [traffic_light_event.TIMER_COMPLETE]: (
            _state: green_state,
            _event: timer_complete_event,
        ): yellow_state => {
            console.log("🟢 → 🟡 Green to Yellow");
            return { s_type: traffic_light_state.YELLOW, duration: 5 };
        },
        [traffic_light_event.EMERGENCY]: (
            state: green_state,
            event: emergency_event,
        ): red_state => {
            console.log(`🚨 Emergency ${event.vehicle_type}! Green to Red`);
            return { s_type: traffic_light_state.RED, duration: 60 };
        },
    },
} as const;

// Create the state machine
const traffic_light = new state_machine<
    typeof traffic_light_state,
    red_state | yellow_state | green_state,
    typeof traffic_light_event,
    emergency_event | timer_complete_event,
    typeof traffic_light_transitions
>(traffic_light_transitions);

// Usage examples
console.log("=== Traffic Light State Machine ===\n");

// ✅ Valid transitions
const state = {
    s_type: traffic_light_state.RED,
    duration: 45,
};
console.log("Initial state:", state);

const state2 = traffic_light.transition(state, {
    e_type: traffic_light_event.TIMER_COMPLETE,
});
console.log("After timer:", state, "\n");

const state3 = traffic_light.transition(state2, {
    e_type: traffic_light_event.EMERGENCY,
    vehicle_type: "ambulance",
});

console.log("After emergency:", state, state2, state3, "\n");

// ❌ These would cause TypeScript errors (uncomment to see):
// @ts-expect-error
traffic_light.transition({ s_type: traffic_light_state.RED, duration: 45 }, { e_type: traffic_light_event.EMERGENCY });

// @ts-expect-error
traffic_light.transition({ s_type: traffic_light_state.YELLOW, duration: 5 }, { e_type: traffic_light_event.EMERGENCY });
