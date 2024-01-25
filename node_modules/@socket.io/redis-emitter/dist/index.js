"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastOperator = exports.RESERVED_EVENTS = exports.Emitter = void 0;
const socket_io_parser_1 = require("socket.io-parser");
const msgpack = require("notepack.io");
const debug_1 = require("debug");
const debug = debug_1.default("socket.io-emitter");
const UID = "emitter";
/**
 * Request types, for messages between nodes
 */
var RequestType;
(function (RequestType) {
    RequestType[RequestType["SOCKETS"] = 0] = "SOCKETS";
    RequestType[RequestType["ALL_ROOMS"] = 1] = "ALL_ROOMS";
    RequestType[RequestType["REMOTE_JOIN"] = 2] = "REMOTE_JOIN";
    RequestType[RequestType["REMOTE_LEAVE"] = 3] = "REMOTE_LEAVE";
    RequestType[RequestType["REMOTE_DISCONNECT"] = 4] = "REMOTE_DISCONNECT";
    RequestType[RequestType["REMOTE_FETCH"] = 5] = "REMOTE_FETCH";
    RequestType[RequestType["SERVER_SIDE_EMIT"] = 6] = "SERVER_SIDE_EMIT";
})(RequestType || (RequestType = {}));
class Emitter {
    constructor(redisClient, opts, nsp = "/") {
        this.redisClient = redisClient;
        this.nsp = nsp;
        this.opts = Object.assign({
            key: "socket.io",
            parser: msgpack,
        }, opts);
        this.broadcastOptions = {
            nsp,
            broadcastChannel: this.opts.key + "#" + nsp + "#",
            requestChannel: this.opts.key + "-request#" + nsp + "#",
            parser: this.opts.parser,
        };
    }
    /**
     * Return a new emitter for the given namespace.
     *
     * @param nsp - namespace
     * @public
     */
    of(nsp) {
        return new Emitter(this.redisClient, this.opts, (nsp[0] !== "/" ? "/" : "") + nsp);
    }
    /**
     * Emits to all clients.
     *
     * @return Always true
     * @public
     */
    emit(ev, ...args) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).emit(ev, ...args);
    }
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return BroadcastOperator
     * @public
     */
    to(room) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).to(room);
    }
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return BroadcastOperator
     * @public
     */
    in(room) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).in(room);
    }
    /**
     * Excludes a room when emitting.
     *
     * @param room
     * @return BroadcastOperator
     * @public
     */
    except(room) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).except(room);
    }
    /**
     * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
     * receive messages (because of network slowness or other issues, or because they’re connected through long polling
     * and is in the middle of a request-response cycle).
     *
     * @return BroadcastOperator
     * @public
     */
    get volatile() {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions)
            .volatile;
    }
    /**
     * Sets the compress flag.
     *
     * @param compress - if `true`, compresses the sending data
     * @return BroadcastOperator
     * @public
     */
    compress(compress) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).compress(compress);
    }
    /**
     * Makes the matching socket instances join the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsJoin(rooms) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).socketsJoin(rooms);
    }
    /**
     * Makes the matching socket instances leave the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsLeave(rooms) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).socketsLeave(rooms);
    }
    /**
     * Makes the matching socket instances disconnect
     *
     * @param close - whether to close the underlying connection
     * @public
     */
    disconnectSockets(close = false) {
        return new BroadcastOperator(this.redisClient, this.broadcastOptions).disconnectSockets(close);
    }
    /**
     * Send a packet to the Socket.IO servers in the cluster
     *
     * @param args - any number of serializable arguments
     */
    serverSideEmit(...args) {
        const withAck = typeof args[args.length - 1] === "function";
        if (withAck) {
            throw new Error("Acknowledgements are not supported");
        }
        const request = JSON.stringify({
            uid: UID,
            type: RequestType.SERVER_SIDE_EMIT,
            data: args,
        });
        this.redisClient.publish(this.broadcastOptions.requestChannel, request);
    }
}
exports.Emitter = Emitter;
exports.RESERVED_EVENTS = new Set([
    "connect",
    "connect_error",
    "disconnect",
    "disconnecting",
    "newListener",
    "removeListener",
]);
class BroadcastOperator {
    constructor(redisClient, broadcastOptions, rooms = new Set(), exceptRooms = new Set(), flags = {}) {
        this.redisClient = redisClient;
        this.broadcastOptions = broadcastOptions;
        this.rooms = rooms;
        this.exceptRooms = exceptRooms;
        this.flags = flags;
    }
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return a new BroadcastOperator instance
     * @public
     */
    to(room) {
        const rooms = new Set(this.rooms);
        if (Array.isArray(room)) {
            room.forEach((r) => rooms.add(r));
        }
        else {
            rooms.add(room);
        }
        return new BroadcastOperator(this.redisClient, this.broadcastOptions, rooms, this.exceptRooms, this.flags);
    }
    /**
     * Targets a room when emitting.
     *
     * @param room
     * @return a new BroadcastOperator instance
     * @public
     */
    in(room) {
        return this.to(room);
    }
    /**
     * Excludes a room when emitting.
     *
     * @param room
     * @return a new BroadcastOperator instance
     * @public
     */
    except(room) {
        const exceptRooms = new Set(this.exceptRooms);
        if (Array.isArray(room)) {
            room.forEach((r) => exceptRooms.add(r));
        }
        else {
            exceptRooms.add(room);
        }
        return new BroadcastOperator(this.redisClient, this.broadcastOptions, this.rooms, exceptRooms, this.flags);
    }
    /**
     * Sets the compress flag.
     *
     * @param compress - if `true`, compresses the sending data
     * @return a new BroadcastOperator instance
     * @public
     */
    compress(compress) {
        const flags = Object.assign({}, this.flags, { compress });
        return new BroadcastOperator(this.redisClient, this.broadcastOptions, this.rooms, this.exceptRooms, flags);
    }
    /**
     * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
     * receive messages (because of network slowness or other issues, or because they’re connected through long polling
     * and is in the middle of a request-response cycle).
     *
     * @return a new BroadcastOperator instance
     * @public
     */
    get volatile() {
        const flags = Object.assign({}, this.flags, { volatile: true });
        return new BroadcastOperator(this.redisClient, this.broadcastOptions, this.rooms, this.exceptRooms, flags);
    }
    /**
     * Emits to all clients.
     *
     * @return Always true
     * @public
     */
    emit(ev, ...args) {
        if (exports.RESERVED_EVENTS.has(ev)) {
            throw new Error(`"${ev}" is a reserved event name`);
        }
        // set up packet object
        const data = [ev, ...args];
        const packet = {
            type: socket_io_parser_1.PacketType.EVENT,
            data: data,
            nsp: this.broadcastOptions.nsp,
        };
        const opts = {
            rooms: [...this.rooms],
            flags: this.flags,
            except: [...this.exceptRooms],
        };
        const msg = this.broadcastOptions.parser.encode([UID, packet, opts]);
        let channel = this.broadcastOptions.broadcastChannel;
        if (this.rooms && this.rooms.size === 1) {
            channel += this.rooms.keys().next().value + "#";
        }
        debug("publishing message to channel %s", channel);
        this.redisClient.publish(channel, msg);
        return true;
    }
    /**
     * Makes the matching socket instances join the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsJoin(rooms) {
        const request = JSON.stringify({
            type: RequestType.REMOTE_JOIN,
            opts: {
                rooms: [...this.rooms],
                except: [...this.exceptRooms],
            },
            rooms: Array.isArray(rooms) ? rooms : [rooms],
        });
        this.redisClient.publish(this.broadcastOptions.requestChannel, request);
    }
    /**
     * Makes the matching socket instances leave the specified rooms
     *
     * @param rooms
     * @public
     */
    socketsLeave(rooms) {
        const request = JSON.stringify({
            type: RequestType.REMOTE_LEAVE,
            opts: {
                rooms: [...this.rooms],
                except: [...this.exceptRooms],
            },
            rooms: Array.isArray(rooms) ? rooms : [rooms],
        });
        this.redisClient.publish(this.broadcastOptions.requestChannel, request);
    }
    /**
     * Makes the matching socket instances disconnect
     *
     * @param close - whether to close the underlying connection
     * @public
     */
    disconnectSockets(close = false) {
        const request = JSON.stringify({
            type: RequestType.REMOTE_DISCONNECT,
            opts: {
                rooms: [...this.rooms],
                except: [...this.exceptRooms],
            },
            close,
        });
        this.redisClient.publish(this.broadcastOptions.requestChannel, request);
    }
}
exports.BroadcastOperator = BroadcastOperator;
