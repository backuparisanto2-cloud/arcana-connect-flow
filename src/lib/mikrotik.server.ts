import net from "node:net";

/**
 * Minimal MikroTik RouterOS binary API client (RouterOS 6.43+ plain login).
 * Runs only on the server; never import this from client code.
 */

function encodeWord(word: string): Buffer {
  const data = Buffer.from(word, "utf8");
  const len = data.length;
  let prefix: Buffer;
  if (len < 0x80) {
    prefix = Buffer.from([len]);
  } else if (len < 0x4000) {
    prefix = Buffer.alloc(2);
    prefix.writeUInt16BE(len | 0x8000);
  } else if (len < 0x200000) {
    prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(len | 0xc00000);
    prefix = prefix.subarray(1);
  } else {
    prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(len | 0xe0000000);
  }
  return Buffer.concat([prefix, data]);
}

function encodeSentence(words: string[]): Buffer {
  return Buffer.concat([...words.map(encodeWord), Buffer.from([0])]);
}

type Sentence = string[];

class RouterOsClient {
  private socket: net.Socket;
  private buffer = Buffer.alloc(0);
  private sentences: Sentence[] = [];
  private current: Sentence = [];
  private waiters: Array<() => void> = [];
  private closed = false;
  private error: Error | null = null;

  constructor(socket: net.Socket) {
    this.socket = socket;
    socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.parse();
      this.flushWaiters();
    });
    socket.on("error", (err) => {
      this.error = err instanceof Error ? err : new Error(String(err));
      this.closed = true;
      this.flushWaiters();
    });
    socket.on("close", () => {
      this.closed = true;
      this.flushWaiters();
    });
  }

  private flushWaiters() {
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();
  }

  private parse() {
    for (;;) {
      if (this.buffer.length < 1) return;
      const first = this.buffer[0]!;
      let headerLen = 1;
      let len: number;
      if (first < 0x80) {
        len = first;
      } else if ((first & 0xc0) === 0x80) {
        if (this.buffer.length < 2) return;
        headerLen = 2;
        len = ((first & 0x3f) << 8) | this.buffer[1]!;
      } else if ((first & 0xe0) === 0xc0) {
        if (this.buffer.length < 3) return;
        headerLen = 3;
        len = ((first & 0x1f) << 16) | (this.buffer[1]! << 8) | this.buffer[2]!;
      } else if ((first & 0xf0) === 0xe0) {
        if (this.buffer.length < 4) return;
        headerLen = 4;
        len =
          ((first & 0x0f) << 24) |
          (this.buffer[1]! << 16) |
          (this.buffer[2]! << 8) |
          this.buffer[3]!;
      } else {
        if (this.buffer.length < 5) return;
        headerLen = 5;
        len = this.buffer.readUInt32BE(1);
      }

      if (len === 0) {
        this.buffer = this.buffer.subarray(headerLen);
        if (this.current.length > 0) {
          this.sentences.push(this.current);
          this.current = [];
        }
        continue;
      }

      if (this.buffer.length < headerLen + len) return;
      const word = this.buffer.subarray(headerLen, headerLen + len).toString("utf8");
      this.buffer = this.buffer.subarray(headerLen + len);
      this.current.push(word);
    }
  }

  send(words: string[]) {
    this.socket.write(encodeSentence(words));
  }

  /** Reads sentences until !done or !fatal, returns all collected sentences. */
  async readReply(timeoutMs: number): Promise<Sentence[]> {
    const deadline = Date.now() + timeoutMs;
    const collected: Sentence[] = [];
    for (;;) {
      while (this.sentences.length > 0) {
        const sentence = this.sentences.shift()!;
        collected.push(sentence);
        const tag = sentence[0];
        if (tag === "!done") return collected;
        if (tag === "!fatal") {
          throw new Error(sentence.slice(1).join(" ") || "Koneksi ditutup router");
        }
      }
      if (this.error) throw this.error;
      if (this.closed) throw new Error("Koneksi ke router terputus");
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error("Router tidak merespons (timeout)");
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, Math.min(remaining, 250));
        this.waiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  }

  close() {
    try {
      this.socket.destroy();
    } catch {
      /* ignore */
    }
  }
}

function connect(host: string, port: number, timeoutMs: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Tidak bisa terhubung ke ${host}:${port} (timeout)`));
    }, timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (err) => {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

export function attrsOf(sentence: Sentence): Record<string, string> {
  const out: Record<string, string> = {};
  for (const word of sentence) {
    if (!word.startsWith("=")) continue;
    const idx = word.indexOf("=", 1);
    if (idx === -1) continue;
    out[word.slice(1, idx)] = word.slice(idx + 1);
  }
  return out;
}

export type RouterCommand = { command: string; args?: string[] };

export async function runRouterCommands(
  commands: RouterCommand[],
  timeoutMs = 10000,
): Promise<Record<string, string>[][]> {
  const host = process.env["MIKROTIK_HOST"];
  const port = Number(process.env["MIKROTIK_PORT"] ?? "8728");
  const user = process.env["MIKROTIK_USER"];
  const password = process.env["MIKROTIK_PASSWORD"];

  if (!host || !user || !password) {
    throw new Error("Kredensial router belum dikonfigurasi.");
  }

  const socket = await connect(host, port, timeoutMs);
  const client = new RouterOsClient(socket);
  try {
    client.send(["/login", `=name=${user}`, `=password=${password}`]);
    const loginReply = await client.readReply(timeoutMs);
    const trap = loginReply.find((s) => s[0] === "!trap");
    if (trap) {
      const message = attrsOf(trap)["message"] ?? "login gagal";
      throw new Error(`Login router ditolak: ${message}`);
    }

    const results: Record<string, string>[][] = [];
    for (const cmd of commands) {
      client.send([cmd.command, ...(cmd.args ?? [])]);
      const reply = await client.readReply(timeoutMs);
      const trapped = reply.find((s) => s[0] === "!trap");
      if (trapped) {
        const message = attrsOf(trapped)["message"] ?? "perintah ditolak";
        throw new Error(`${cmd.command}: ${message}`);
      }
      results.push(reply.filter((s) => s[0] === "!re").map(attrsOf));
    }
    return results;
  } finally {
    client.close();
  }
}
