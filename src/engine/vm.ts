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

  // Standard library built-ins
  private builtins: Record<string, (...args: any[]) => any> = {
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
    str: (val: any) => (typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)),
    int: (val: any) => parseInt(val, 10) || 0,
    float: (val: any) => parseFloat(val) || 0,
    abs: (val: any) => Math.abs(val),
    min: (...args: any[]) => Math.min(...args),
    max: (...args: any[]) => Math.max(...args),
    type: (val: any) => {
      if (Array.isArray(val)) return 'array';
      if (val === null) return 'null';
      return typeof val;
    },
    // Real Native AI K-Means intent without dependencies
    train_kmeans: (points: number[][], k = 2, maxIter = 20) => {
      this.trackAlloc();
      if (!points || points.length === 0) return { centroids: [], clusters: [] };
      // Initialize centroids with first k points or random
      const centroids: number[][] = [];
      for (let i = 0; i < Math.min(k, points.length); i++) {
        centroids.push([...points[i]]);
      }
      let clusters: number[] = new Array(points.length).fill(0);

      for (let iter = 0; iter < maxIter; iter++) {
        // Assign each point to closest centroid
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

        // Recalculate centroids
        const sums = centroids.map(() => [0, 0, 0]); // sumX, sumY, count
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
        const varName = inst.arg as string;
        // Search in local frame variables first
        if (varName in frame.variables) {
          this.stack.push(frame.variables[varName]);
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
        } else if (this.frames[0]?.variables && varName in this.frames[0].variables) {
          this.stack.push(this.frames[0].variables[varName]);
        } else {
          this.stack.push(null);
        }
        break;
      }

      case OpCode.OP_STORE_VAR: {
        const varName = inst.arg as string;
        const val = this.stack.pop();
        frame.variables[varName] = val;
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
            } else if (name === 'len') {
              this.stack.push(target.length);
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
