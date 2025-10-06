// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Converts a union type to a tuple type.
 * Example: 0 | 1 | 2 becomes [0, 1, 2]
 */
type union_to_tuple_t<T extends number> = (
    (T extends unknown ? (t: T) => T : never) extends infer U ? (U extends unknown ? (u: U) => unknown : never) extends (v: infer V) => unknown ? V
        : never
        : never
) extends (_: unknown) => infer W ? [...union_to_tuple_t<Exclude<T, W>>, W]
    : [];

type value_of_t<T extends object> = T[keyof T];
// type number_value_of_t<T extends Record<string, number>> = T[keyof T] extends infer X ? X extends number ? X : never : never;

// ============================================================================
// State Machine Types
// ============================================================================

interface state<t extends Record<string, number>> {
    s_type: t[keyof t];
}

interface state_n<t extends number> {
    s_type: t;
}

interface event<t extends Record<string, number>> {
    e_type: t[keyof t];
}

interface event_n<t extends number> {
    e_type: t;
}

/**
 * Defines the structure for transition functions.
 * Maps state types to event types to transition functions.
 */
type transition_map_t<
    union_enum_state_type extends number,
    union_state_type extends state_n<union_enum_state_type>,
    union_enum_event_type extends number,
    union_event_type extends event_n<union_enum_event_type>,
> = {
    [s in union_enum_state_type]?: {
        [e in union_enum_event_type]?: (
            state: match_state_t<union_enum_state_type, union_state_type, s>,
            event: match_event_t<union_enum_event_type, union_event_type, e>,
        ) => union_state_type;
    };
};

type match_state_t<
    union_enum_state_type extends number,
    union_state_type extends state_n<union_enum_state_type>,
    enum_state_type,
> = union_state_type extends { s_type: enum_state_type } ? union_state_type : never;

type match_event_t<
    union_enum_event_type extends number,
    union_event_type extends event_n<union_enum_event_type>,
    enum_event_type,
> = union_event_type extends { e_type: enum_event_type } ? union_event_type : never;

/**
 * Extracts valid event types for a given state from the transition map.
 */
type possible_event_t<
    transition_map_type extends Record<number, unknown>,
    state_type extends number,
> = value_of_t<
    {
        [k in keyof transition_map_type as k extends state_type ? k : never]: transition_map_type[k];
    }
> extends infer t ? t extends never ? never
    : keyof t
    : never;

/**
 * Determines the resulting state type after a transition.
 */
type final_state_t<
    union_enum_state_type extends number,
    union_state_type extends state_n<union_enum_state_type>,
    union_enum_event_type extends number,
    union_event_type extends event_n<union_enum_event_type>,
    // transition_map_type extends Record<union_enum_state_type, Record<union_enum_event_type, ((...args: unknown[]) => union_state_type) > >,
    transition_map_type extends transition_map_t<union_enum_state_type, union_state_type, union_enum_event_type, union_event_type>,
    state_type extends number,
    event_type extends number,
> = value_of_t<
    {
        [k in keyof transition_map_type as k extends state_type ? k : never]: value_of_t<
            {
                [l in keyof transition_map_type[k] as l extends event_type ? l : never]: transition_map_type[k][l];
            }
        > extends (
            initialState: match_state_t<union_enum_state_type, union_state_type, state_type>,
            event: match_event_t<union_enum_event_type, union_event_type, event_type>,
        ) => infer return_type ? return_type
            : never;
    }
>;

// ============================================================================
// State Machine Class
// ============================================================================

/**
 * A type-safe state machine that validates state transitions at compile time.
 *
 * @template union_state_type - Array of valid state type values
 * @template union_event_type - Array of valid event type values
 * @template transition_map_type - Map defining valid transitions between states
 */
class state_machine<
    union_enum_state_obj_type extends Record<string, number>,
    union_state_type extends state<union_enum_state_obj_type>,
    union_enum_event_obj_type extends Record<string, number>,
    union_event_type extends event<union_enum_event_obj_type>,
    // transition_map_type extends transition_function_t<number_value_of_t<union_enum_state_type>, number_value_of_t<union_enum_event_type>>,
    transition_map_type extends transition_map_t<value_of_t<union_enum_state_obj_type>, union_state_type, value_of_t<union_enum_event_obj_type>, union_event_type>,
> {
    constructor(private transitions: transition_map_type) {}

    /**
     * Performs a state transition based on the current state and event.
     * TypeScript will enforce that only valid event types are used for each state.
     *
     * @param initialState - The current state
     * @param event - The event triggering the transition
     * @returns The new state after the transition
     */
    transition<
        state_type extends { s_type: Extract<(keyof transition_map_type), number> },
        event_type extends { e_type: possible_event_t<transition_map_type, state_type["s_type"]> },
    >(
        state: state_type,
        event: event_type,
    ): final_state_t<
        value_of_t<union_enum_state_obj_type>,
        union_state_type,
        value_of_t<union_enum_event_obj_type>,
        union_event_type,
        transition_map_type,
        state_type["s_type"],
        event_type["e_type"]
    > {
        const stateTransitions = this.transitions[state.s_type];
        const transitionFn = (stateTransitions as Exclude<typeof stateTransitions, undefined>)[
            event.e_type
        ] as unknown as (
            state: state_type,
            event: event_type,
        ) => final_state_t<
            value_of_t<union_enum_state_obj_type>,
            union_state_type,
            value_of_t<union_enum_event_obj_type>,
            union_event_type,
            transition_map_type,
            state_type["s_type"],
            event_type["e_type"]
        >;

        return (transitionFn as Exclude<typeof transitionFn, undefined>)(state, event);
    }
}

export type { event, state, union_to_tuple_t };
export { state_machine };
