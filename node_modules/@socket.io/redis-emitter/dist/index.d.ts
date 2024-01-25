import type { DefaultEventsMap, EventNames, EventParams, EventsMap, TypedEventBroadcaster } from "./typed-events";
interface Parser {
    encode: (msg: any) => any;
}
export interface EmitterOptions {
    /**
     * @default "socket.io"
     */
    key?: string;
    /**
     * The parser to use for encoding messages sent to Redis.
     * Defaults to notepack.io, a MessagePack implementation.
     */
    parser?: Parser;
}
interface BroadcastOptions {
    nsp: string;
    broadcastChannel: string;
    requestChannel: string;
    parser: Parser;
}
interface BroadcastFlags {
    volatile?: boolean;
    compress?: boolean;
}
export declare class Emitter<EmitEvents extends EventsMap = DefaultEventsMap> {
    readonly redisClient: any;
    readonly nsp: string;
    private readonly opts;
    private readonly broadcastOptions;
    constructor(redisClient: any, opts?: EmitterOptions, nsp?: string);
    /**
     * Return a new emitter for the given namespace.
     *
     * @param nsp - namespace
     * @public
     */
    of(nsp: string): Emitter<EmitEvents>;
    /**
     * Emits to all clients.
     *
     * @return Always true
     * @public
     */
    emit<Ev extends EventNames<EmitEvents>>(ev: Ev, ...args: EventParams<EmitEvents, Ev>): true;
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return BroadcastOperator
     * @public
     */
    to(room: string | string[]): BroadcastOperator<EmitEvents>;
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return BroadcastOperator
     * @public
     */
    in(room: string | string[]): BroadcastOperator<EmitEvents>;
    /**
     * Excludes a room when emitting.
     *
     * @param room
     * @return BroadcastOperator
     * @public
     */
    except(room: string | string[]): BroadcastOperator<EmitEvents>;
    /**
     * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
     * receive messages (because of network slowness or other issues, or because they’re connected through long polling
     * and is in the middle of a request-response cycle).
     *
     * @return BroadcastOperator
     * @public
     */
    get volatile(): BroadcastOperator<EmitEvents>;
    /**
     * Sets the compress flag.
     *
     * @param compress - if `true`, compresses the sending data
     * @return BroadcastOperator
     * @public
     */
    compress(compress: boolean): BroadcastOperator<EmitEvents>;
    /**
     * Makes the matching socket instances join the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsJoin(rooms: string | string[]): void;
    /**
     * Makes the matching socket instances leave the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsLeave(rooms: string | string[]): void;
    /**
     * Makes the matching socket instances disconnect
     *
     * @param close - whether to close the underlying connection
     * @public
     */
    disconnectSockets(close?: boolean): void;
    /**
     * Send a packet to the Socket.IO servers in the cluster
     *
     * @param args - any number of serializable arguments
     */
    serverSideEmit(...args: any[]): void;
}
export declare const RESERVED_EVENTS: ReadonlySet<string | Symbol>;
export declare class BroadcastOperator<EmitEvents extends EventsMap> implements TypedEventBroadcaster<EmitEvents> {
    private readonly redisClient;
    private readonly broadcastOptions;
    private readonly rooms;
    private readonly exceptRooms;
    private readonly flags;
    constructor(redisClient: any, broadcastOptions: BroadcastOptions, rooms?: Set<string>, exceptRooms?: Set<string>, flags?: BroadcastFlags);
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return a new BroadcastOperator instance
     * @public
     */
    to(room: string | string[]): BroadcastOperator<EmitEvents>;
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return a new BroadcastOperator instance
     * @public
     */
    in(room: string | string[]): BroadcastOperator<EmitEvents>;
    /**
     * Excludes a room when emitting.
     *
     * @param room
     * @return a new BroadcastOperator instance
     * @public
     */
    except(room: string | string[]): BroadcastOperator<EmitEvents>;
    /**
     * Sets the compress flag.
     *
     * @param compress - if `true`, compresses the sending data
     * @return a new BroadcastOperator instance
     * @public
     */
    compress(compress: boolean): BroadcastOperator<EmitEvents>;
    /**
     * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
     * receive messages (because of network slowness or other issues, or because they’re connected through long polling
     * and is in the middle of a request-response cycle).
     *
     * @return a new BroadcastOperator instance
     * @public
     */
    get volatile(): BroadcastOperator<EmitEvents>;
    /**
     * Emits to all clients.
     *
     * @return Always true
     * @public
     */
    emit<Ev extends EventNames<EmitEvents>>(ev: Ev, ...args: EventParams<EmitEvents, Ev>): true;
    /**
     * Makes the matching socket instances join the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsJoin(rooms: string | string[]): void;
    /**
     * Makes the matching socket instances leave the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsLeave(rooms: string | string[]): void;
    /**
     * Makes the matching socket instances disconnect
     *
     * @param close - whether to close the underlying connection
     * @public
     */
    disconnectSockets(close?: boolean): void;
}
export {};
