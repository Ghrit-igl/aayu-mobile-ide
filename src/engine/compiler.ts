/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Bytecode Compiler
 * Compiles Abstract Syntax Tree (AST) into Stack VM Bytecode Chunk.
 */

import {
  ASTNode,
  ProgramNode,
  OpCode,
  Instruction,
  BytecodeChunk,
  SourceLocation,
} from './types';

export class CompilerError extends Error {
  line: number;
  column: number;
  constructor(message: string, loc: SourceLocation) {
    super(`Compiler error at line ${loc.line}, col ${loc.column}: ${message}`);
    this.name = 'CompilerError';
    this.line = loc.line;
    this.column = loc.column;
  }
}

export class Compiler {
  private chunk: BytecodeChunk;
  private loopBreakJumps: number[][] = [];
  private loopContinueTargets: number[] = [];

  constructor() {
    this.chunk = {
      instructions: [],
      constants: [],
      lines: [],
      functions: {},
      models: {},
      routes: {},
    };
  }

  compile(program: ProgramNode): BytecodeChunk {
    for (const stmt of program.body) {
      this.compileStatement(stmt);
    }
    this.emit(OpCode.OP_HALT, undefined, program.loc.line);
    return this.chunk;
  }

  private compileStatement(node: ASTNode): void {
    switch (node.kind) {
      case 'Program':
        for (const s of node.body) this.compileStatement(s);
        break;

      case 'VarDecl':
        this.compileExpression(node.init);
        this.emit(OpCode.OP_STORE_VAR, node.name, node.loc.line);
        break;

      case 'Assignment':
        this.compileExpression(node.value);
        if (node.target.kind === 'IdentifierExpr') {
          if (node.operator === '+=') {
            this.emit(OpCode.OP_LOAD_VAR, node.target.name, node.loc.line);
            this.emit(OpCode.OP_ADD, undefined, node.loc.line);
          } else if (node.operator === '-=') {
            this.emit(OpCode.OP_LOAD_VAR, node.target.name, node.loc.line);
            this.emit(OpCode.OP_SUB, undefined, node.loc.line);
          }
          this.emit(OpCode.OP_STORE_VAR, node.target.name, node.loc.line);
        } else if (node.target.kind === 'IndexExpr') {
          this.compileExpression(node.target.target);
          this.compileExpression(node.target.index);
          this.emit(OpCode.OP_INDEX_SET, undefined, node.loc.line);
        }
        break;

      case 'ExpressionStmt':
        this.compileExpression(node.expression);
        this.emit(OpCode.OP_POP, undefined, node.loc.line);
        break;

      case 'FunctionDecl': {
        const fnCompiler = new Compiler();
        const fnChunk = fnCompiler.compile({
          kind: 'Program',
          body: node.body,
          loc: node.loc,
        });
        // Ensure last instruction is return if not present
        const lastOp = fnChunk.instructions[fnChunk.instructions.length - 2]?.op;
        if (lastOp !== OpCode.OP_RETURN) {
          const constIdx = fnChunk.constants.length;
          fnChunk.constants.push(null);
          fnChunk.instructions.splice(fnChunk.instructions.length - 1, 0, {
            op: OpCode.OP_CONSTANT,
            opName: OpCode[OpCode.OP_CONSTANT],
            arg: constIdx,
            line: node.loc.line,
          });
          fnChunk.instructions.splice(fnChunk.instructions.length - 1, 0, {
            op: OpCode.OP_RETURN,
            opName: OpCode[OpCode.OP_RETURN],
            line: node.loc.line,
          });
        }
        this.chunk.functions[node.name] = {
          params: node.params,
          chunk: fnChunk,
        };
        break;
      }

      case 'IfStmt': {
        this.compileExpression(node.condition);
        const jumpIfFalseIdx = this.emit(OpCode.OP_JUMP_IF_FALSE, 0, node.loc.line);

        for (const s of node.thenBranch) {
          this.compileStatement(s);
        }

        const endJumps: number[] = [];
        endJumps.push(this.emit(OpCode.OP_JUMP, 0, node.loc.line));
        this.patchJump(jumpIfFalseIdx);

        if (node.elifBranches && node.elifBranches.length > 0) {
          for (const elif of node.elifBranches) {
            this.compileExpression(elif.condition);
            const elifJumpFalse = this.emit(OpCode.OP_JUMP_IF_FALSE, 0, elif.condition.loc.line);
            for (const s of elif.body) this.compileStatement(s);
            endJumps.push(this.emit(OpCode.OP_JUMP, 0, elif.condition.loc.line));
            this.patchJump(elifJumpFalse);
          }
        }

        if (node.elseBranch && node.elseBranch.length > 0) {
          for (const s of node.elseBranch) this.compileStatement(s);
        }

        for (const j of endJumps) {
          this.patchJump(j);
        }
        break;
      }

      case 'WhileStmt': {
        const loopStart = this.chunk.instructions.length;
        this.loopContinueTargets.push(loopStart);
        this.loopBreakJumps.push([]);

        this.compileExpression(node.condition);
        const exitJump = this.emit(OpCode.OP_JUMP_IF_FALSE, 0, node.loc.line);

        for (const s of node.body) this.compileStatement(s);

        this.emit(OpCode.OP_JUMP, loopStart, node.loc.line);
        this.patchJump(exitJump);

        const breaks = this.loopBreakJumps.pop() || [];
        for (const brk of breaks) {
          this.patchJump(brk);
        }
        this.loopContinueTargets.pop();
        break;
      }

      case 'ForStmt': {
        // Evaluate iterable expression
        this.compileExpression(node.iterable);
        // We will execute for loops using compiler-generated iterator or VM helper
        this.emit(OpCode.OP_STORE_VAR, `__iter_${node.iterator}`, node.loc.line);
        this.emitConstant(0, node.loc.line);
        this.emit(OpCode.OP_STORE_VAR, `__idx_${node.iterator}`, node.loc.line);

        const loopStart = this.chunk.instructions.length;
        this.loopContinueTargets.push(loopStart);
        this.loopBreakJumps.push([]);

        // Condition: idx < len(iter)
        this.emit(OpCode.OP_LOAD_VAR, `__idx_${node.iterator}`, node.loc.line);
        this.emit(OpCode.OP_LOAD_VAR, `__iter_${node.iterator}`, node.loc.line);
        this.emit(OpCode.OP_LOAD_VAR, 'len', node.loc.line);
        this.emit(OpCode.OP_CALL, { argCount: 1 }, node.loc.line);
        this.emit(OpCode.OP_LT, undefined, node.loc.line);

        const exitJump = this.emit(OpCode.OP_JUMP_IF_FALSE, 0, node.loc.line);

        // Assign current element: iterator = __iter__[__idx__]
        this.emit(OpCode.OP_LOAD_VAR, `__iter_${node.iterator}`, node.loc.line);
        this.emit(OpCode.OP_LOAD_VAR, `__idx_${node.iterator}`, node.loc.line);
        this.emit(OpCode.OP_INDEX_GET, undefined, node.loc.line);
        this.emit(OpCode.OP_STORE_VAR, node.iterator, node.loc.line);

        for (const s of node.body) this.compileStatement(s);

        // Increment index: __idx__ = __idx__ + 1
        this.emit(OpCode.OP_LOAD_VAR, `__idx_${node.iterator}`, node.loc.line);
        this.emitConstant(1, node.loc.line);
        this.emit(OpCode.OP_ADD, undefined, node.loc.line);
        this.emit(OpCode.OP_STORE_VAR, `__idx_${node.iterator}`, node.loc.line);

        this.emit(OpCode.OP_JUMP, loopStart, node.loc.line);
        this.patchJump(exitJump);

        const breaks = this.loopBreakJumps.pop() || [];
        for (const brk of breaks) {
          this.patchJump(brk);
        }
        this.loopContinueTargets.pop();
        break;
      }

      case 'LoopStmt': {
        const loopStart = this.chunk.instructions.length;
        this.loopContinueTargets.push(loopStart);
        this.loopBreakJumps.push([]);

        for (const s of node.body) this.compileStatement(s);

        this.emit(OpCode.OP_JUMP, loopStart, node.loc.line);

        const breaks = this.loopBreakJumps.pop() || [];
        for (const brk of breaks) {
          this.patchJump(brk);
        }
        this.loopContinueTargets.pop();
        break;
      }

      case 'ReturnStmt':
        if (node.value) {
          this.compileExpression(node.value);
        } else {
          this.emitConstant(null, node.loc.line);
        }
        this.emit(OpCode.OP_RETURN, undefined, node.loc.line);
        break;

      case 'BreakStmt': {
        if (this.loopBreakJumps.length === 0) {
          throw new CompilerError("Cannot use 'break' outside of a loop", node.loc);
        }
        const jumpIdx = this.emit(OpCode.OP_JUMP, 0, node.loc.line);
        this.loopBreakJumps[this.loopBreakJumps.length - 1].push(jumpIdx);
        break;
      }

      case 'ContinueStmt': {
        if (this.loopContinueTargets.length === 0) {
          throw new CompilerError("Cannot use 'continue' outside of a loop", node.loc);
        }
        const target = this.loopContinueTargets[this.loopContinueTargets.length - 1];
        this.emit(OpCode.OP_JUMP, target, node.loc.line);
        break;
      }

      case 'ModelDecl':
        this.chunk.models[node.name] = { fields: node.fields };
        this.emit(OpCode.OP_MODEL_DEF, { name: node.name, fields: node.fields }, node.loc.line);
        break;

      case 'InsertStmt':
        for (const [key, expr] of Object.entries(node.data)) {
          this.emitConstant(key, node.loc.line);
          this.compileExpression(expr);
        }
        this.emit(
          OpCode.OP_MODEL_INSERT,
          { model: node.model, count: Object.keys(node.data).length },
          node.loc.line
        );
        break;

      case 'FindStmt':
        if (node.condition) {
          this.compileExpression(node.condition.value);
          this.emit(
            OpCode.OP_MODEL_FIND,
            { model: node.model, field: node.condition.field, op: node.condition.op },
            node.loc.line
          );
        } else {
          this.emit(OpCode.OP_MODEL_FIND, { model: node.model }, node.loc.line);
        }
        break;

      case 'AppDecl':
        this.emit(OpCode.OP_APP_DEF, node.name, node.loc.line);
        break;

      case 'RunStmt':
        this.emit(OpCode.OP_RUN_TARGET, node.target, node.loc.line);
        break;

      case 'RespondStmt':
        this.compileExpression(node.value);
        this.emit(OpCode.OP_RESPOND, undefined, node.loc.line);
        break;

      case 'RouteDecl': {
        const nestedRoutes = node.body.filter((s: ASTNode) => s.kind === 'RouteDecl');
        if (nestedRoutes.length > 0) {
          for (const nr of nestedRoutes) {
            this.compileStatement(nr);
          }
          break;
        }
        const routeCompiler = new Compiler();
        const routeChunk = routeCompiler.compile({
          kind: 'Program',
          body: node.body,
          loc: node.loc,
        });
        const routeKey = `${node.method} ${node.path}`;
        this.chunk.routes[routeKey] = {
          method: node.method,
          path: node.path,
          chunk: routeChunk,
        };
        this.emit(
          OpCode.OP_ROUTE_DEF,
          { method: node.method, path: node.path },
          node.loc.line
        );
        break;
      }

      case 'UIDecl':
        this.emit(OpCode.OP_UI_DEF, node, node.loc.line);
        break;
    }
  }

  private compileExpression(node: ASTNode): void {
    switch (node.kind) {
      case 'LiteralExpr':
        this.emitConstant(node.value, node.loc.line);
        break;

      case 'IdentifierExpr':
        this.emit(OpCode.OP_LOAD_VAR, node.name, node.loc.line);
        break;

      case 'BinaryExpr':
        this.compileExpression(node.left);
        this.compileExpression(node.right);
        switch (node.operator) {
          case '+':
            this.emit(OpCode.OP_ADD, undefined, node.loc.line);
            break;
          case '-':
            this.emit(OpCode.OP_SUB, undefined, node.loc.line);
            break;
          case '*':
            this.emit(OpCode.OP_MUL, undefined, node.loc.line);
            break;
          case '/':
            this.emit(OpCode.OP_DIV, undefined, node.loc.line);
            break;
          case '%':
            this.emit(OpCode.OP_MOD, undefined, node.loc.line);
            break;
          case '^':
            this.emit(OpCode.OP_POW, undefined, node.loc.line);
            break;
          case '==':
            this.emit(OpCode.OP_EQ, undefined, node.loc.line);
            break;
          case '!=':
            this.emit(OpCode.OP_NEQ, undefined, node.loc.line);
            break;
          case '<':
            this.emit(OpCode.OP_LT, undefined, node.loc.line);
            break;
          case '<=':
            this.emit(OpCode.OP_LTE, undefined, node.loc.line);
            break;
          case '>':
            this.emit(OpCode.OP_GT, undefined, node.loc.line);
            break;
          case '>=':
            this.emit(OpCode.OP_GTE, undefined, node.loc.line);
            break;
          case 'and':
            this.emit(OpCode.OP_AND, undefined, node.loc.line);
            break;
          case 'or':
            this.emit(OpCode.OP_OR, undefined, node.loc.line);
            break;
        }
        break;

      case 'UnaryExpr':
        this.compileExpression(node.operand);
        if (node.operator === '-') {
          this.emit(OpCode.OP_NEG, undefined, node.loc.line);
        } else if (node.operator === '!' || node.operator === 'not') {
          this.emit(OpCode.OP_NOT, undefined, node.loc.line);
        }
        break;

      case 'CallExpr': {
        // Builtin respond
        if (node.callee.kind === 'IdentifierExpr' && node.callee.name === 'respond') {
          if (node.args.length > 0) {
            this.compileExpression(node.args[0]);
          } else {
            this.emitConstant(null, node.loc.line);
          }
          this.emit(OpCode.OP_RESPOND, undefined, node.loc.line);
          return;
        }

        // Builtin print or println
        if (node.callee.kind === 'IdentifierExpr' && (node.callee.name === 'print' || node.callee.name === 'println')) {
          for (const arg of node.args) {
            this.compileExpression(arg);
          }
          this.emit(
            node.callee.name === 'println' ? OpCode.OP_PRINTLN : OpCode.OP_PRINT,
            node.args.length,
            node.loc.line
          );
          return;
        }

        // Method calls e.g. list.push(val), list.len()
        if (node.callee.kind === 'IdentifierExpr' && node.callee.name.includes('.')) {
          const parts = node.callee.name.split('.');
          const methodName = parts[parts.length - 1];
          for (const arg of node.args) {
            this.compileExpression(arg);
          }
          this.emit(
            OpCode.OP_CALL,
            { name: methodName, argCount: node.args.length, isMethod: true },
            node.loc.line
          );
          return;
        }

        // Standard function call
        for (const arg of node.args) {
          this.compileExpression(arg);
        }
        this.compileExpression(node.callee);
        this.emit(OpCode.OP_CALL, { argCount: node.args.length }, node.loc.line);
        break;
      }

      case 'IndexExpr':
        this.compileExpression(node.target);
        this.compileExpression(node.index);
        this.emit(OpCode.OP_INDEX_GET, undefined, node.loc.line);
        break;

      case 'ArrayExpr':
        for (const el of node.elements) {
          this.compileExpression(el);
        }
        this.emit(OpCode.OP_BUILD_ARRAY, node.elements.length, node.loc.line);
        break;

      case 'DictExpr':
        for (const entry of node.entries) {
          this.emitConstant(entry.key, node.loc.line);
          this.compileExpression(entry.value);
        }
        this.emit(OpCode.OP_BUILD_DICT, node.entries.length, node.loc.line);
        break;

      case 'FindStmt':
        this.compileStatement(node);
        break;

      default:
        throw new CompilerError(`Unsupported expression node '${(node as any).kind}'`, node.loc);
    }
  }

  private emit(op: OpCode, arg?: any, line = 0): number {
    this.chunk.instructions.push({
      op,
      opName: OpCode[op],
      arg,
      line,
    });
    this.chunk.lines.push(line);
    return this.chunk.instructions.length - 1;
  }

  private emitConstant(value: any, line: number): void {
    const constIdx = this.chunk.constants.length;
    this.chunk.constants.push(value);
    this.emit(OpCode.OP_CONSTANT, constIdx, line);
  }

  private patchJump(instructionIdx: number): void {
    const currentTarget = this.chunk.instructions.length;
    this.chunk.instructions[instructionIdx].arg = currentTarget;
  }

  /**
   * Disassembles the bytecode chunk into human-readable assembly lines
   */
  static disassemble(chunk: BytecodeChunk, title = 'main'): string {
    const lines: string[] = [];
    lines.push(`== Bytecode Disassembly [${title}] ==`);
    lines.push(`Constants: [${chunk.constants.map((c, i) => `${i}: ${JSON.stringify(c)}`).join(', ')}]`);
    lines.push('--------------------------------------------------');
    lines.push('Offset  Line  OpCode              Argument');
    lines.push('--------------------------------------------------');

    chunk.instructions.forEach((inst, idx) => {
      const offset = String(idx).padStart(4, '0');
      const line = String(inst.line || 1).padStart(4, ' ');
      const opName = inst.opName.padEnd(18, ' ');
      let argStr = '';
      if (inst.arg !== undefined) {
        if (inst.op === OpCode.OP_CONSTANT) {
          argStr = `${inst.arg} (${JSON.stringify(chunk.constants[inst.arg])})`;
        } else if (typeof inst.arg === 'object') {
          argStr = JSON.stringify(inst.arg);
        } else {
          argStr = String(inst.arg);
        }
      }
      lines.push(`${offset}    ${line}  ${opName}  ${argStr}`);
    });

    if (Object.keys(chunk.functions).length > 0) {
      lines.push('\n-- Defined Functions --');
      for (const [name, fn] of Object.entries(chunk.functions)) {
        lines.push(`\nFunction: ${name}(${fn.params.join(', ')})`);
        lines.push(Compiler.disassemble(fn.chunk, name));
      }
    }

    if (Object.keys(chunk.models).length > 0) {
      lines.push('\n-- Intent Schema Models --');
      for (const [name, model] of Object.entries(chunk.models)) {
        lines.push(`Model ${name} { ${model.fields.map(f => `${f.name}: ${f.type}`).join(', ')} }`);
      }
    }

    if (Object.keys(chunk.routes).length > 0) {
      lines.push('\n-- Intent HTTP Routes --');
      for (const [key, r] of Object.entries(chunk.routes)) {
        lines.push(`Route: ${r.method} ${r.path}`);
      }
    }

    return lines.join('\n');
  }
}
