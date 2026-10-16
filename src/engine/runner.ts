/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Engine Execution Runner & Multi-File Orchestrator
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { Compiler } from './compiler';
import { AayuVM } from './vm';
import { ExecutionResult, BytecodeChunk, ProgramNode } from './types';
import { AayuGraphGenerator } from './graph';

export interface CompilationArtifacts {
  success: boolean;
  tokensCount: number;
  ast: ProgramNode | null;
  bytecode: BytecodeChunk | null;
  disassembly: string;
  durationMs: number;
  error?: {
    stage: 'lexer' | 'parser' | 'compiler';
    line: number;
    column: number;
    message: string;
  };
}

export class AayuRunner {
  /**
   * Pre-processes multi-file projects by resolving imports from a virtual file system
   */
  static resolveImports(
    mainCode: string,
    files: Record<string, string>,
    visited: Set<string> = new Set()
  ): { code: string; resolvedFiles: string[] } {
    const resolvedFiles: string[] = [];
    const lines = mainCode.split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Match: import "math_utils.aayu" or import math_utils
      const importMatch = trimmed.match(/^import\s+["']?([a-zA-Z0-9_\-\.\/]+)["']?\s*;?$/);
      if (importMatch) {
        let importedFile = importMatch[1];
        if (!importedFile.endsWith('.aayu')) {
          importedFile += '.aayu';
        }

        if (visited.has(importedFile)) {
          // Prevent circular imports
          continue;
        }

        if (files[importedFile]) {
          visited.add(importedFile);
          resolvedFiles.push(importedFile);
          const subResult = this.resolveImports(files[importedFile], files, visited);
          processedLines.push(`// --- Begin Import: ${importedFile} ---`);
          processedLines.push(subResult.code);
          processedLines.push(`// --- End Import: ${importedFile} ---`);
          resolvedFiles.push(...subResult.resolvedFiles);
        } else {
          processedLines.push(`// Warning: could not resolve imported module '${importedFile}'`);
        }
      } else {
        processedLines.push(line);
      }
    }

    return {
      code: processedLines.join('\n'),
      resolvedFiles,
    };
  }

  /**
   * Compiles code without running it (for Build / Validate / Disassemble mode)
   */
  static compileOnly(sourceCode: string): CompilationArtifacts {
    const start = performance.now();
    try {
      // 1. Lexer
      const lexer = new Lexer(sourceCode);
      const tokens = lexer.tokenize();

      // 2. Parser
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // 3. Compiler
      const compiler = new Compiler();
      const bytecode = compiler.compile(ast);
      const disassembly = Compiler.disassemble(bytecode, 'main.aayu');

      const durationMs = parseFloat((performance.now() - start).toFixed(2));
      return {
        success: true,
        tokensCount: tokens.length,
        ast,
        bytecode,
        disassembly,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2));
      const stage = err.name === 'LexerError' ? 'lexer' : err.name === 'ParserError' ? 'parser' : 'compiler';
      return {
        success: false,
        tokensCount: 0,
        ast: null,
        bytecode: null,
        disassembly: '',
        durationMs,
        error: {
          stage,
          line: err.line || 1,
          column: err.column || 1,
          message: err.message || String(err),
        },
      };
    }
  }

  /**
   * Full pipeline: Source -> Lexer -> AST -> Bytecode -> Stack VM -> Output
   */
  static run(
    sourceCode: string,
    options: {
      stdin?: string;
      virtualFiles?: Record<string, string>;
    } = {}
  ): ExecutionResult & { compilation: CompilationArtifacts } {
    let executableCode = sourceCode;

    // Resolve multi-file project if virtualFiles are provided
    if (options.virtualFiles && Object.keys(options.virtualFiles).length > 0) {
      const resolved = this.resolveImports(sourceCode, options.virtualFiles);
      executableCode = resolved.code;
    }

    const compilation = this.compileOnly(executableCode);
    if (!compilation.success || !compilation.bytecode) {
      return {
        success: false,
        stdout: '',
        stderr: `${compilation.error?.stage.toUpperCase()} ERROR: ${compilation.error?.message}\n`,
        exitCode: 1,
        durationMs: compilation.durationMs,
        stepCount: 0,
        gcStats: {
          allocatedCount: 0,
          sweptCount: 0,
          activeHeapObjects: 0,
        },
        error: compilation.error ? {
          ...compilation.error,
          stage: compilation.error.stage,
        } : undefined,
        compilation,
      };
    }

    const vm = new AayuVM();
    const execResult = vm.execute(compilation.bytecode, options.stdin || '');
    const graph = AayuGraphGenerator.generate(compilation.ast, execResult);

    return {
      ...execResult,
      mermaidGraph: graph.mermaidCode,
      compilation,
    };
  }

  /**
   * Executes a registered route endpoint on a lightweight VM context
   */
  static executeRoute(
    routeChunk: BytecodeChunk,
    dbState: Record<string, any[]> = {}
  ): { status: number; payload: any; stdout: string; durationMs: number } {
    const start = performance.now();
    const vm = new AayuVM();
    // Pre-populate database state
    for (const [k, v] of Object.entries(dbState)) {
      (vm as any).database[k] = [...v];
    }
    const res = vm.execute(routeChunk);
    const durationMs = parseFloat((performance.now() - start).toFixed(4));
    return {
      status: 200,
      payload: vm.responsePayload !== null ? vm.responsePayload : (res.returnedValue ?? { status: 'success' }),
      stdout: res.stdout,
      durationMs,
    };
  }
}
