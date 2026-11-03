/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Stack-based Virtual Machine (VM)
 * Features execution timeout, instruction quota, garbage collection simulation,
 * embedded Intent SQLite/CRUD engine, and standard library.
 */

import {
  BytecodeChunk,
  OpCode,
  ExecutionResult,
  Instruction,
} from './types';

export class VMRuntimeError extends Error {
  line: number;
  column: number;
  constructor(message: string, line = 0, column = 0) {
    super(`Runtime error at line ${line}: ${message}`);
    this.name = 'VMRuntimeError';
    this.line = line;
    this.column = column;
  }
}

interface CallFrame {
  chunk: BytecodeChunk;
  ip: number;
  variables: Record<string, any>;
  returnToCaller?: boolean;
}

export class AayuVM {
  private stack: any[] = [];
  private frames: CallFrame[] = [];
  private stdout: string[] = [];
  private stderr: string[] = [];
  private stepCount = 0;
  private maxSteps = 100000;
  private startTime = 0;
  private timeoutMs = 3000;

  // Embedded Intent relational database state
  private database: Record<string, any[]> = {};
  // Registered Intent HTTP routes
  private routes: Record<string, { method: string; path: string; chunk: BytecodeChunk }> = {};
  // Rendered Intent UI tree
  private uiTree: any = null;
  public appName = '';
  public responsePayload: any = null;

  // GC metrics
  private allocatedObjects = 0;
  private sweptObjects = 0;

  // Standard library built-ins (std/math, std/collections, std/crypto, std/tokens, std/contracts, std/test)
  private builtins: Record<string, (...args: any[]) => any> = {
    // --- Math & Scientific Built-ins ---
    sqrt: (x: any) => Math.sqrt(Number(x)),
    math_sqrt: (x: any) => Math.sqrt(Number(x)),
    exp: (x: any) => Math.exp(Number(x)),
    math_exp: (x: any) => Math.exp(Number(x)),
    ln: (x: any) => Math.log(Number(x)),
    math_ln: (x: any) => Math.log(Number(x)),
    sin: (x: any) => Math.sin(Number(x)),
    math_sin: (x: any) => Math.sin(Number(x)),
    cos: (x: any) => Math.cos(Number(x)),
    math_cos: (x: any) => Math.cos(Number(x)),
    tan: (x: any) => Math.tan(Number(x)),
    math_tan: (x: any) => Math.tan(Number(x)),
    tanh: (x: any) => Math.tanh(Number(x)),
    math_tanh: (x: any) => Math.tanh(Number(x)),
    pow: (x: any, y: any) => Math.pow(Number(x), Number(y)),
    math_pow: (x: any, y: any) => Math.pow(Number(x), Number(y)),
    abs: (val: any) => Math.abs(Number(val)),
    round: (val: any) => Math.round(Number(val)),
    floor: (val: any) => Math.floor(Number(val)),
    ceil: (val: any) => Math.ceil(Number(val)),
    clamp: (val: any, min: any, max: any) => Math.min(Math.max(Number(val), Number(min)), Number(max)),
    relu: (x: any) => Math.max(0, Number(x)),
    sigmoid: (x: any) => 1 / (1 + Math.exp(-Number(x))),
    min: (...args: any[]) => {
      const flattened = args.flat();
      return Math.min(...flattened.map(Number));
    },
    max: (...args: any[]) => {
      const flattened = args.flat();
      return Math.max(...flattened.map(Number));
    },

    // --- Collections & Arrays ---
    range: (start: number, end?: number, step = 1) => {
      this.trackAlloc();
      if (end === undefined) {
        end = start;
        start = 0;
      }
      const res: number[] = [];
      for (let i = start; step > 0 ? i < end : i > end; i += step) {
        res.push(i);
      }
      return res;
    },
    len: (obj: any) => {
      if (Array.isArray(obj) || typeof obj === 'string') return obj.length;
      if (typeof obj === 'object' && obj !== null) return Object.keys(obj).length;
      return 0;
    },
    __len__: (obj: any) => {
      if (Array.isArray(obj) || typeof obj === 'string') return obj.length;
      if (typeof obj === 'object' && obj !== null) return Object.keys(obj).length;
      return 0;
    },
    sum: (arr: any) => {
      if (!Array.isArray(arr)) return 0;
      return arr.reduce((acc, curr) => acc + Number(curr), 0);
    },
    mean: (arr: any) => {
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      return arr.reduce((acc, curr) => acc + Number(curr), 0) / arr.length;
    },
    sorted: (arr: any) => {
      if (!Array.isArray(arr)) return [];
      this.trackAlloc();
      return [...arr].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
    },
    reversed: (arr: any) => {
      if (!Array.isArray(arr)) return [];
      this.trackAlloc();
      return [...arr].reverse();
    },
    unique: (arr: any) => {
      if (!Array.isArray(arr)) return [];
      this.trackAlloc();
      return Array.from(new Set(arr));
    },
    array_min: (arr: any) => {
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      return Math.min(...arr.map(Number));
    },
    array_max: (arr: any) => {
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      return Math.max(...arr.map(Number));
    },
    contains: (container: any, item: any) => {
      if (Array.isArray(container) || typeof container === 'string') {
        return container.includes(item);
      }
      if (typeof container === 'object' && container !== null) {
        return item in container;
      }
      return false;
    },

    // --- Crypto & Security (std/crypto) ---
    hash_string: (str: any) => AayuVM.sha256(String(str)),
    sha256: (str: any) => AayuVM.sha256(String(str)),

    // --- AI Agent Tokenomics (std/tokens) ---
    estimate_tokens: (text: any) => {
      const s = String(text || '');
      return Math.max(1, Math.ceil(s.length / 3.8));
    },
    compress_ai_context: (prompt: any, maxTokens = 1000) => {
      let s = String(prompt || '');
      // Strip comments and redundant blank lines
      s = s
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'))
        .join(' ');
      const maxChars = Math.max(1, Math.floor(Number(maxTokens) * 3.8));
      if (s.length > maxChars) {
        s = s.substring(0, maxChars);
      }
      return s;
    },

    // --- Contracts, Assertions & Testing (std/contracts, std/test) ---
    require: (cond: any, msg = 'Precondition requirement failed') => {
      if (!cond) throw new VMRuntimeError(`[Require Error] ${msg}`, this.currentLine());
      return true;
    },
    ensure: (cond: any, msg = 'Postcondition check failed') => {
      if (!cond) throw new VMRuntimeError(`[Ensure Error] ${msg}`, this.currentLine());
      return true;
    },
    invariant: (cond: any, msg = 'Invariant violation') => {
      if (!cond) throw new VMRuntimeError(`[Invariant Error] ${msg}`, this.currentLine());
      return true;
    },
    assert_eq: (actual: any, expected: any, testName = 'Assertion') => {
      const actStr = typeof actual === 'object' ? JSON.stringify(actual) : String(actual);
      const expStr = typeof expected === 'object' ? JSON.stringify(expected) : String(expected);
      if (actStr !== expStr) {
        throw new VMRuntimeError(`Assertion failed [${testName}]: expected ${expStr}, got ${actStr}`, this.currentLine());
      }
      return true;
    },
    assert_true: (cond: any, testName = 'Assertion') => {
      if (!cond) {
        throw new VMRuntimeError(`Assertion failed [${testName}]: condition was not true`, this.currentLine());
      }
      return true;
    },
    test_begin_suite: (name: any) => {
      this.stdout.push(`\n🧪 === TEST SUITE: ${name} ===\n`);
      return true;
    },
    test_end_suite: () => {
      this.stdout.push(`✅ === TEST SUITE COMPLETED SUCCESSFULLY ===\n\n`);
      return true;
    },

    // --- Types & Conversions ---
    str: (val: any) => (typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)),
    int: (val: any) => parseInt(val, 10) || 0,
    float: (val: any) => parseFloat(val) || 0,
    type: (val: any) => {
      if (Array.isArray(val)) return 'array';
      if (val === null) return 'null';
      return typeof val;
    },
    keys: (val: any) => (typeof val === 'object' && val !== null ? Object.keys(val) : []),
    values: (val: any) => (typeof val === 'object' && val !== null ? Object.values(val) : []),
    now: () => Date.now(),
    time_now: () => Date.now(),
    time: () => Date.now() / 1000,
    json_parse: (str: any) => {
      try { return JSON.parse(str); } catch { return null; }
    },
    json_stringify: (obj: any) => JSON.stringify(obj),

    // --- Embedded Database Helpers (std/db) ---
    db_create_record: (modelName: string, data: any) => {
      if (!this.database[modelName]) this.database[modelName] = [];
      const newRec = { id: this.database[modelName].length + 1, ...data };
      this.database[modelName].push(newRec);
      this.trackAlloc();
      return newRec;
    },
    db_filter_records: (modelName: string, field: string, val: any) => {
      const recs = this.database[modelName] || [];
      return recs.filter(r => r[field] === val);
    },
    db_find_by_id: (modelName: string, id: number) => {
      const recs = this.database[modelName] || [];
      return recs.find(r => r.id === id) || null;
    },
    db_count_records: (modelName: string) => {
      return (this.database[modelName] || []).length;
    },

    // --- Native AI K-Means Intent ---
    train_kmeans: (points: number[][], k = 2, maxIter = 20) => {
      this.trackAlloc();
      if (!points || points.length === 0) return { centroids: [], clusters: [] };
      const centroids: number[][] = [];
      for (let i = 0; i < Math.min(k, points.length); i++) {
        centroids.push([...points[i]]);
      }
      let clusters: number[] = new Array(points.length).fill(0);

      for (let iter = 0; iter < maxIter; iter++) {
        let changed = false;
        for (let pIdx = 0; pIdx < points.length; pIdx++) {
          const pt = points[pIdx];
          let minDist = Infinity;
          let bestCluster = 0;
          for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
            const c = centroids[cIdx];
            const dist = Math.hypot((pt[0] || 0) - (c[0] || 0), (pt[1] || 0) - (c[1] || 0));
            if (dist < minDist) {
              minDist = dist;
              bestCluster = cIdx;
            }
          }
          if (clusters[pIdx] !== bestCluster) {
            clusters[pIdx] = bestCluster;
            changed = true;
          }
        }
        if (!changed) break;

        const sums = centroids.map(() => [0, 0, 0]);
        for (let pIdx = 0; pIdx < points.length; pIdx++) {
          const cIdx = clusters[pIdx];
          sums[cIdx][0] += points[pIdx][0] || 0;
          sums[cIdx][1] += points[pIdx][1] || 0;
          sums[cIdx][2] += 1;
        }
        for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
          if (sums[cIdx][2] > 0) {
            centroids[cIdx][0] = parseFloat((sums[cIdx][0] / sums[cIdx][2]).toFixed(4));
            centroids[cIdx][1] = parseFloat((sums[cIdx][1] / sums[cIdx][2]).toFixed(4));
          }
        }
      }
      return { centroids, clusters, iterations: maxIter };
    },
  };

  /**
   * Pure JS SHA-256 implementation for zero-dependency browser/mobile crypto
   */
  static sha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const words: number[] = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    for (let c = 0; c < ascii.length; c++) {
      words[c >> 2] |= (ascii.charCodeAt(c) & 0xff) << (8 * (3 - (c % 4)));
    }
    words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

    for (let i = 0; i < words.length; i += 16) {
      const w = words.slice(i, i + 16);
      const oldHash = hash.slice(0);

      for (let j = 0; j < 64; j++) {
        const w15 = w[j - 15], w2 = w[j - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = j < 16 ? w[j] : (w[j - 16] + s0 + w[j - 7] + s1) | 0;

        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[j] + w[j]) | 0;
        const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

        hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
      }

      for (let j = 0; j < 8; j++) {
        hash[j] = (hash[j] + oldHash[j]) | 0;
      }
    }

    let result = '';
    for (let i = 0; i < 8; i++) {
      for (let j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  private trackAlloc(): void {
    this.allocatedObjects++;
    if (this.allocatedObjects % 15 === 0) {
      // Simulate mark-and-sweep GC step
      this.sweptObjects += 2;
    }
  }

  execute(chunk: BytecodeChunk, inputStdin = ''): ExecutionResult {
    this.stack = [];
    this.frames = [];
    this.stdout = [];
    this.stderr = [];
    this.stepCount = 0;
    this.startTime = performance.now();
    this.allocatedObjects = 0;
    this.sweptObjects = 0;
    this.uiTree = null;

    // Pre-register routes and models from chunk
    for (const [k, r] of Object.entries(chunk.routes)) {
      this.routes[k] = r;
    }
    for (const name of Object.keys(chunk.models)) {
      if (!this.database[name]) {
        this.database[name] = [];
      }
    }

    const mainFrame: CallFrame = {
      chunk,
      ip: 0,
      variables: {},
      returnToCaller: false,
    };
    this.frames.push(mainFrame);

    let returnedValue: any = undefined;

    try {
      while (this.frames.length > 0) {
        this.stepCount++;
        if (this.stepCount > this.maxSteps) {
          throw new VMRuntimeError(
            `Execution exceeded safety limit of ${this.maxSteps} instructions. Possible infinite loop detected.`,
            this.currentLine()
          );
        }

        if (performance.now() - this.startTime > this.timeoutMs) {
          throw new VMRuntimeError(
            `Execution timed out after ${this.timeoutMs}ms. Execution stopped to protect mobile device responsiveness.`,
            this.currentLine()
          );
        }

        const frame = this.currentFrame();
        if (frame.ip >= frame.chunk.instructions.length) {
          this.frames.pop();
          continue;
        }

        const inst = frame.chunk.instructions[frame.ip++];
        const halt = this.executeInstruction(inst, frame);
        if (halt) {
          returnedValue = this.stack.pop();
          break;
        }
      }

      const durationMs = parseFloat((performance.now() - this.startTime).toFixed(2));
      const mainVars = { ...(mainFrame?.variables || {}) };

      // Auto-echo if stdout is empty to provide immediate visual feedback (e.g. 'a = 7' or '7 + 3')
      if (this.stdout.length === 0) {
        if (returnedValue !== undefined && returnedValue !== null) {
          const formatted = typeof returnedValue === 'object' ? JSON.stringify(returnedValue) : String(returnedValue);
          this.stdout.push(`=> ${formatted}\n`);
        } else {
          const userVars = Object.entries(mainVars).filter(([k]) => !k.startsWith('__'));
          if (userVars.length > 0) {
            for (const [k, v] of userVars) {
              const formatted = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
              this.stdout.push(`${k} = ${formatted}\n`);
            }
          }
        }
      }

      return {
        success: true,
        stdout: this.stdout.join(''),
        stderr: this.stderr.join(''),
        exitCode: 0,
        durationMs,
        stepCount: this.stepCount,
        gcStats: {
          allocatedCount: this.allocatedObjects,
          sweptCount: this.sweptObjects,
          activeHeapObjects: Math.max(0, this.allocatedObjects - this.sweptObjects),
        },
        returnedValue,
        variablesState: mainVars,
        databaseState: this.database,
        registeredRoutes: Object.values(this.routes).map(r => ({ method: r.method, path: r.path, chunk: r.chunk })),
        uiTree: this.uiTree,
        appName: this.appName,
      };
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - this.startTime).toFixed(2));
      const message = err.message || String(err);
      this.stderr.push(message + '\n');
      return {
        success: false,
        stdout: this.stdout.join(''),
        stderr: this.stderr.join(''),
        exitCode: 1,
        durationMs,
        stepCount: this.stepCount,
        gcStats: {
          allocatedCount: this.allocatedObjects,
          sweptCount: this.sweptObjects,
          activeHeapObjects: Math.max(0, this.allocatedObjects - this.sweptObjects),
        },
        error: {
          line: err.line || this.currentLine() || 1,
          column: err.column || 1,
          message,
          stage: 'runtime',
        },
      };
    }
  }

  private executeInstruction(inst: Instruction, frame: CallFrame): boolean {
    switch (inst.op) {
      case OpCode.OP_HALT:
        return true;

      case OpCode.OP_CONSTANT: {
        const val = frame.chunk.constants[inst.arg];
        this.stack.push(val);
        break;
      }

      case OpCode.OP_LOAD_VAR: {
        const varName = typeof inst.arg === 'object' && inst.arg !== null ? inst.arg.name : (inst.arg as string);
        let foundVal: any = undefined;
        let hasFound = false;

        // Search lexical call frames from current frame down to global frame (0)
        for (let f = this.frames.length - 1; f >= 0; f--) {
          if (varName in this.frames[f].variables) {
            foundVal = this.frames[f].variables[varName];
            hasFound = true;
            break;
          }
        }

        if (hasFound) {
          this.stack.push(foundVal);
        } else if (varName in this.builtins) {
          this.stack.push(this.builtins[varName]);
        } else if (this.lookupFunction(varName)) {
          this.stack.push({ isFunction: true, name: varName });
        } else if (varName in frame.chunk.models || varName in this.database) {
          const modelName = varName;
          const modelObj = {
            isModel: true,
            name: modelName,
            all: () => this.database[modelName] || [],
            find: (idOrFilter: any) => {
              const recs = this.database[modelName] || [];
              if (typeof idOrFilter === 'number') {
                return recs.find(r => r.id === idOrFilter) || null;
              }
              return recs;
            },
            insert: (data: any) => {
              if (!this.database[modelName]) this.database[modelName] = [];
              const newRec = { id: this.database[modelName].length + 1, ...data };
              this.database[modelName].push(newRec);
              return newRec;
            }
          };
          this.stack.push(modelObj);
        } else {
          this.stack.push(null);
        }
        break;
      }

      case OpCode.OP_STORE_VAR: {
        const arg = inst.arg;
        const varName = typeof arg === 'object' && arg !== null ? arg.name : (arg as string);
        const isDecl = typeof arg === 'object' && arg !== null ? Boolean(arg.isDecl) : false;
        const val = this.stack.pop();

        if (isDecl) {
          // Explicit declaration ('let' or 'state') binds in current frame
          frame.variables[varName] = val;
        } else {
          // Assignment ('=' or '+=' or '-=') mutates in nearest existing scope
          let found = false;
          for (let f = this.frames.length - 1; f >= 0; f--) {
            if (varName in this.frames[f].variables) {
              this.frames[f].variables[varName] = val;
              found = true;
              break;
            }
          }
          if (!found) {
            frame.variables[varName] = val;
          }
        }
        break;
      }

      case OpCode.OP_POP:
        this.stack.pop();
        break;

      case OpCode.OP_ADD: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        if (Array.isArray(a) && Array.isArray(b)) {
          this.trackAlloc();
          this.stack.push([...a, ...b]);
        } else if (typeof a === 'string' || typeof b === 'string') {
          this.stack.push(String(a) + String(b));
        } else {
          this.stack.push(a + b);
        }
        break;
      }

      case OpCode.OP_SUB: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a - b);
        break;
      }

      case OpCode.OP_MUL: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        if (typeof a === 'string' && typeof b === 'number') {
          this.stack.push(a.repeat(Math.max(0, b)));
        } else {
          this.stack.push(a * b);
        }
        break;
      }

      case OpCode.OP_DIV: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        if (b === 0) {
          throw new VMRuntimeError('Division by zero', inst.line);
        }
        this.stack.push(a / b);
        break;
      }

      case OpCode.OP_MOD: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a % b);
        break;
      }

      case OpCode.OP_POW: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(Math.pow(a, b));
        break;
      }

      case OpCode.OP_NEG: {
        const a = this.stack.pop();
        this.stack.push(-a);
        break;
      }

      case OpCode.OP_NOT: {
        const a = this.stack.pop();
        this.stack.push(!a);
        break;
      }

      case OpCode.OP_AND: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(Boolean(a && b));
        break;
      }

      case OpCode.OP_OR: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(Boolean(a || b));
        break;
      }

      case OpCode.OP_EQ: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a === b);
        break;
      }

      case OpCode.OP_NEQ: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a !== b);
        break;
      }

      case OpCode.OP_LT: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a < b);
        break;
      }

      case OpCode.OP_LTE: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a <= b);
        break;
      }

      case OpCode.OP_GT: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a > b);
        break;
      }

      case OpCode.OP_GTE: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a >= b);
        break;
      }

      case OpCode.OP_JUMP: {
        frame.ip = inst.arg as number;
        break;
      }

      case OpCode.OP_JUMP_IF_FALSE: {
        const condition = this.stack.pop();
        if (!condition) {
          frame.ip = inst.arg as number;
        }
        break;
      }

      case OpCode.OP_PRINT:
      case OpCode.OP_PRINTLN: {
        const argCount = inst.arg as number;
        const args: any[] = [];
        for (let i = 0; i < argCount; i++) {
          args.unshift(this.stack.pop());
        }
        const text = args
          .map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))
          .join(' ');
        this.stdout.push(text + '\n');
        this.stack.push(null);
        break;
      }

      case OpCode.OP_BUILD_ARRAY: {
        this.trackAlloc();
        const count = inst.arg as number;
        const elements: any[] = [];
        for (let i = 0; i < count; i++) {
          elements.unshift(this.stack.pop());
        }
        this.stack.push(elements);
        break;
      }

      case OpCode.OP_BUILD_DICT: {
        this.trackAlloc();
        const count = inst.arg as number;
        const dict: Record<string, any> = {};
        for (let i = 0; i < count; i++) {
          const val = this.stack.pop();
          const key = this.stack.pop();
          dict[key] = val;
        }
        this.stack.push(dict);
        break;
      }

      case OpCode.OP_INDEX_GET: {
        const index = this.stack.pop();
        const target = this.stack.pop();
        if (target === null || target === undefined) {
          throw new VMRuntimeError(`Cannot index into null or undefined`, inst.line);
        }
        if (Array.isArray(target)) {
          const idx = typeof index === 'number' ? (index < 0 ? target.length + index : index) : index;
          if (idx < 0 || idx >= target.length) {
            throw new VMRuntimeError(`Array index out of bounds: index ${index}, length ${target.length}`, inst.line);
          }
          this.stack.push(target[idx]);
        } else if (typeof target === 'object') {
          this.stack.push(target[index]);
        } else if (typeof target === 'string') {
          this.stack.push(target[index] || '');
        } else {
          throw new VMRuntimeError(`Type '${typeof target}' cannot be indexed`, inst.line);
        }
        break;
      }

      case OpCode.OP_INDEX_SET: {
        const index = this.stack.pop();
        const target = this.stack.pop();
        const val = this.stack.pop();
        if (Array.isArray(target)) {
          target[index] = val;
        } else if (typeof target === 'object' && target !== null) {
          target[index] = val;
        } else {
          throw new VMRuntimeError(`Cannot assign to index of type '${typeof target}'`, inst.line);
        }
        break;
      }

      case OpCode.OP_CALL: {
        const { argCount, name, isMethod } = inst.arg;

        if (isMethod) {
          // Method call: target is first argument
          const args: any[] = [];
          for (let i = 0; i < argCount; i++) {
            args.unshift(this.stack.pop());
          }
          const target = args[0];
          const methodArgs = args.slice(1);

          if (Array.isArray(target)) {
            if (name === 'push') {
              target.push(methodArgs[0]);
              this.stack.push(target.length);
              return false;
            } else if (name === 'pop') {
              this.stack.push(target.pop());
              return false;
            } else if (name === 'shift') {
              this.stack.push(target.shift());
              return false;
            } else if (name === 'len') {
              this.stack.push(target.length);
              return false;
            } else if (name === 'join') {
              this.stack.push(target.join(methodArgs[0] ?? ','));
              return false;
            } else if (name === 'includes' || name === 'contains') {
              this.stack.push(target.includes(methodArgs[0]));
              return false;
            } else if (name === 'slice') {
              this.stack.push(target.slice(methodArgs[0], methodArgs[1]));
              return false;
            } else if (name === 'reverse') {
              this.stack.push([...target].reverse());
              return false;
            }
          } else if (typeof target === 'string') {
            if (name === 'len') {
              this.stack.push(target.length);
              return false;
            } else if (name === 'upper') {
              this.stack.push(target.toUpperCase());
              return false;
            } else if (name === 'lower') {
              this.stack.push(target.toLowerCase());
              return false;
            } else if (name === 'trim') {
              this.stack.push(target.trim());
              return false;
            } else if (name === 'split') {
              this.stack.push(target.split(methodArgs[0] ?? ' '));
              return false;
            } else if (name === 'startsWith') {
              this.stack.push(target.startsWith(methodArgs[0]));
              return false;
            } else if (name === 'endsWith') {
              this.stack.push(target.endsWith(methodArgs[0]));
              return false;
            } else if (name === 'includes' || name === 'contains') {
              this.stack.push(target.includes(methodArgs[0]));
              return false;
            } else if (name === 'replace') {
              this.stack.push(target.replace(methodArgs[0], methodArgs[1]));
              return false;
            } else if (name === 'slice') {
              this.stack.push(target.slice(methodArgs[0], methodArgs[1]));
              return false;
            }
          }
        }

        const callee = this.stack.pop();
        const args: any[] = [];
        for (let i = 0; i < argCount; i++) {
          args.unshift(this.stack.pop());
        }

        if (typeof callee === 'function') {
          const result = callee(...args);
          this.stack.push(result);
        } else if (callee && callee.isFunction) {
          const fnName = callee.name;
          const fnInfo = this.lookupFunction(fnName);
          if (!fnInfo) {
            throw new VMRuntimeError(`Function '${fnName}' not found`, inst.line);
          }
          const newVars: Record<string, any> = {};
          fnInfo.params.forEach((param, i) => {
            newVars[param] = args[i];
          });
          this.frames.push({
            chunk: fnInfo.chunk,
            ip: 0,
            variables: newVars,
            returnToCaller: true,
          });
        } else if (name && this.builtins[name]) {
          const result = this.builtins[name](...args);
          this.stack.push(result);
        } else {
          throw new VMRuntimeError(`'${callee}' is not a callable function`, inst.line);
        }
        break;
      }

      case OpCode.OP_RETURN: {
        const retVal = this.stack.pop();
        const finishedFrame = this.frames.pop();
        if (finishedFrame?.returnToCaller) {
          this.stack.push(retVal);
        } else {
          this.stack.push(retVal);
          return true;
        }
        break;
      }

      case OpCode.OP_MODEL_DEF: {
        const { name, fields } = inst.arg;
        if (!this.database[name]) {
          this.database[name] = [];
        }
        this.stdout.push(`[AAYU Intent DB] Initialized schema model '${name}' with ${fields.length} columns\n`);
        break;
      }

      case OpCode.OP_MODEL_INSERT: {
        const { model, count } = inst.arg;
        const data: Record<string, any> = {};
        for (let i = 0; i < count; i++) {
          const val = this.stack.pop();
          const key = this.stack.pop();
          data[key] = val;
        }
        if (!this.database[model]) {
          this.database[model] = [];
        }
        const newRecord = { id: this.database[model].length + 1, ...data };
        this.database[model].push(newRecord);
        this.trackAlloc();
        this.stdout.push(`[AAYU Intent DB] Inserted into '${model}': ${JSON.stringify(newRecord)}\n`);
        this.stack.push(newRecord);
        break;
      }

      case OpCode.OP_MODEL_FIND: {
        const { model, field, op } = inst.arg;
        const records = this.database[model] || [];
        if (!field) {
          this.stack.push(records);
          this.stdout.push(`[AAYU Intent DB] Query 'find ${model}': found ${records.length} record(s)\n`);
        } else {
          const targetVal = this.stack.pop();
          const filtered = records.filter(r => {
            if (op === '==') return r[field] === targetVal;
            if (op === '!=') return r[field] !== targetVal;
            if (op === '>') return r[field] > targetVal;
            if (op === '<') return r[field] < targetVal;
            if (op === '>=') return r[field] >= targetVal;
            if (op === '<=') return r[field] <= targetVal;
            return false;
          });
          this.stack.push(filtered);
          this.stdout.push(`[AAYU Intent DB] Query 'find ${model} where ${field} ${op} ${targetVal}': ${filtered.length} match(es)\n`);
        }
        break;
      }

      case OpCode.OP_ROUTE_DEF: {
        const { method, path } = inst.arg;
        this.stdout.push(`[AAYU Intent Web] Registered REST route: [${method}] ${path}\n`);
        break;
      }

      case OpCode.OP_UI_DEF: {
        this.uiTree = inst.arg;
        this.stdout.push(`[AAYU Intent UI] Rendered declarative UI tree widget '${(inst.arg as any).widget}'\n`);
        break;
      }

      case OpCode.OP_APP_DEF: {
        this.appName = inst.arg as string;
        this.stdout.push(`[AAYU Engine] Initialized application '${this.appName}' on Silicon Runtime\n`);
        break;
      }

      case OpCode.OP_RUN_TARGET: {
        const target = inst.arg as string;
        if (target in frame.chunk.functions) {
          const fn = frame.chunk.functions[target];
          this.stdout.push(`[AAYU Engine] Executing entrypoint 'action ${target}'...\n`);
          this.frames.push({
            chunk: fn.chunk,
            ip: 0,
            variables: {},
            returnToCaller: true,
          });
        } else if (this.uiTree && (this.uiTree.props?.name === target || this.uiTree.widget === target)) {
          this.stdout.push(`[AAYU UI Engine] Mounted view page '${target}'\n`);
        } else {
          this.stdout.push(`[AAYU Engine] Run target: ${target}\n`);
        }
        break;
      }

      case OpCode.OP_RESPOND: {
        const val = this.stack.pop();
        this.responsePayload = val;
        this.stdout.push(`[AAYU Response] ${typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}\n`);
        this.stack.push(val);
        break;
      }
    }

    return false;
  }

  private lookupFunction(name: string): { params: string[]; chunk: BytecodeChunk } | null {
    for (let f = this.frames.length - 1; f >= 0; f--) {
      if (this.frames[f]?.chunk?.functions?.[name]) {
        return this.frames[f].chunk.functions[name];
      }
    }
    return null;
  }

  private currentFrame(): CallFrame {
    return this.frames[this.frames.length - 1];
  }

  private currentLine(): number {
    const frame = this.currentFrame();
    if (!frame) return 1;
    const inst = frame.chunk.instructions[Math.max(0, frame.ip - 1)];
    return inst ? inst.line : 1;
  }
}
