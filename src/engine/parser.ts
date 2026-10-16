/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Parser
 * Parses token stream into a typed Abstract Syntax Tree (AST).
 */

import {
  Token,
  TokenType,
  ASTNode,
  ProgramNode,
  VarDeclNode,
  AssignmentNode,
  FunctionDeclNode,
  IfStmtNode,
  WhileStmtNode,
  ForStmtNode,
  LoopStmtNode,
  ReturnStmtNode,
  BreakStmtNode,
  ContinueStmtNode,
  ExpressionStmtNode,
  ModelDeclNode,
  InsertStmtNode,
  FindStmtNode,
  RouteDeclNode,
  UIDeclNode,
  AppDeclNode,
  RunStmtNode,
  RespondStmtNode,
  SourceLocation,
} from './types';

export class ParserError extends Error {
  line: number;
  column: number;
  constructor(message: string, token: Token) {
    super(`Parser error at line ${token.line}, col ${token.column}: ${message} (found '${token.lexeme || token.type}')`);
    this.name = 'ParserError';
    this.line = token.line;
    this.column = token.column;
  }
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ProgramNode {
    const startLoc = this.loc();
    const body: ASTNode[] = [];

    while (!this.isAtEnd()) {
      // Skip redundant semicolons
      if (this.match('SEMICOLON')) continue;
      body.push(this.declaration());
    }

    return {
      kind: 'Program',
      body,
      loc: startLoc,
    };
  }

  private declaration(): ASTNode {
    try {
      if (this.match('APP')) {
        return this.appDeclaration();
      }
      if (this.match('RUN')) {
        return this.runStatement();
      }
      if (this.match('RESPOND')) {
        return this.respondStatement();
      }
      if (this.match('LET', 'MUT', 'CONST')) {
        return this.varDeclaration(this.previous().type === 'MUT');
      }
      if (this.match('STATE')) {
        return this.varDeclaration(true);
      }
      if (this.match('ACTION', 'FN')) {
        return this.functionDeclaration();
      }
      if (this.match('MODEL')) {
        return this.modelDeclaration();
      }
      if (this.match('INSERT')) {
        return this.insertStatement();
      }
      if (this.match('FIND')) {
        return this.findStatement();
      }
      if (this.match('ROUTE')) {
        return this.routeDeclaration();
      }
      if (this.check('PAGE', 'COLUMN', 'ROW', 'STACK', 'TEXT', 'BUTTON', 'CHART')) {
        return this.uiDeclaration();
      }
      return this.statement();
    } catch (err) {
      this.synchronize();
      throw err;
    }
  }

  private appDeclaration(): AppDeclNode {
    const loc = this.loc();
    const nameToken = this.consumeIdentifier("Expect app name after 'app'");
    return {
      kind: 'AppDecl',
      name: nameToken.lexeme,
      loc,
    };
  }

  private runStatement(): RunStmtNode {
    const loc = this.loc();
    const targetToken = this.consumeIdentifier("Expect target identifier after 'run'");
    return {
      kind: 'RunStmt',
      target: targetToken.lexeme,
      loc,
    };
  }

  private respondStatement(): RespondStmtNode {
    const loc = this.loc();
    let value: ASTNode;
    if (this.match('LPAREN')) {
      value = this.expression();
      this.consume('RPAREN', "Expect ')' after respond argument");
    } else {
      value = this.expression();
    }
    this.match('SEMICOLON');
    return {
      kind: 'RespondStmt',
      value,
      loc,
    };
  }

  private varDeclaration(isMut: boolean): VarDeclNode {
    const loc = this.loc();
    const nameToken = this.consumeIdentifier("Expect variable name after 'let' or 'state'");
    const name = nameToken.lexeme;

    let typeAnnotation: string | undefined;
    if (this.match('COLON')) {
      const typeToken = this.consumeIdentifier('Expect type annotation after colon');
      typeAnnotation = typeToken.lexeme;
    }

    this.consume('ASSIGN', "Expect '=' after variable name");
    const init = this.expression();
    this.match('SEMICOLON');

    return {
      kind: 'VarDecl',
      name,
      isMut,
      typeAnnotation,
      init,
      loc,
    };
  }

  private functionDeclaration(): FunctionDeclNode {
    const loc = this.loc();
    const nameToken = this.consumeIdentifier("Expect function name after 'action'");
    const name = nameToken.lexeme;

    const params: string[] = [];
    if (this.match('LPAREN')) {
      if (!this.check('RPAREN')) {
        do {
          const paramToken = this.consumeIdentifier('Expect parameter name');
          params.push(paramToken.lexeme);
          // optional type annotation
          if (this.match('COLON')) {
            this.consumeIdentifier('Expect parameter type');
          }
        } while (this.match('COMMA'));
      }
      this.consume('RPAREN', "Expect ')' after parameters");
    }

    // Optional return type: -> int
    if (this.match('ARROW')) {
      this.consumeIdentifier('Expect return type after ->');
    }

    const body = this.parseAnyBlock();

    return {
      kind: 'FunctionDecl',
      name,
      params,
      body,
      loc,
    };
  }

  private modelDeclaration(): ModelDeclNode {
    const loc = this.loc();
    const nameToken = this.consumeIdentifier('Expect model name');
    const isBrace = this.match('LBRACE');

    const fields: { name: string; type: string }[] = [];
    while (!this.check(isBrace ? 'RBRACE' : 'END') && !this.isAtEnd()) {
      if (this.match('SEMICOLON')) continue;
      const fieldToken = this.consumeIdentifier('Expect field name');
      this.match('COLON');
      let typeName = 'Any';
      if (this.checkIdentifier()) {
        typeName = this.advance().lexeme;
      }
      fields.push({ name: fieldToken.lexeme, type: typeName });
      this.match('COMMA');
    }

    if (isBrace) {
      this.consume('RBRACE', "Expect '}' after model fields");
    } else {
      this.consume('END', "Expect 'end' after model fields");
    }
    return {
      kind: 'ModelDecl',
      name: nameToken.lexeme,
      fields,
      loc,
    };
  }

  private insertStatement(): InsertStmtNode {
    const loc = this.loc();
    const modelToken = this.consumeIdentifier('Expect model name in insert statement');
    this.consume('LBRACE', "Expect '{' with data to insert");

    const data: Record<string, ASTNode> = {};
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      let key = '';
      if (this.checkIdentifier()) {
        key = this.advance().lexeme;
      } else if (this.check('STRING')) {
        key = this.advance().value;
      } else {
        throw new ParserError('Expect field name in insert data', this.peek());
      }

      this.consume('COLON', "Expect ':' after field name");
      data[key] = this.expression();
      this.match('COMMA');
    }

    this.consume('RBRACE', "Expect '}' after insert data");
    this.match('SEMICOLON');

    return {
      kind: 'InsertStmt',
      model: modelToken.lexeme,
      data,
      loc,
    };
  }

  private findStatement(): FindStmtNode {
    const loc = this.loc();
    const modelToken = this.consumeIdentifier('Expect model name in find statement');

    let condition: { field: string; op: string; value: ASTNode } | undefined;
    if (this.match('WHERE')) {
      const fieldToken = this.consumeIdentifier('Expect field name in where condition');
      let op = '==';
      if (this.match('EQ')) op = '==';
      else if (this.match('NEQ')) op = '!=';
      else if (this.match('GT')) op = '>';
      else if (this.match('LT')) op = '<';
      else if (this.match('GTE')) op = '>=';
      else if (this.match('LTE')) op = '<=';
      else {
        throw new ParserError("Expect comparison operator in 'where' clause", this.peek());
      }

      const val = this.expression();
      condition = { field: fieldToken.lexeme, op, value: val };
    }

    this.match('SEMICOLON');

    return {
      kind: 'FindStmt',
      model: modelToken.lexeme,
      condition,
      loc,
    };
  }

  private routeDeclaration(): RouteDeclNode {
    const loc = this.loc();
    let method = 'GET';
    let path = '/';

    if (this.check('STRING')) {
      const raw = this.advance().value as string;
      const parts = raw.trim().split(/\s+/);
      if (parts.length >= 2) {
        method = parts[0].toUpperCase();
        path = parts[1];
      } else {
        path = parts[0];
      }
    } else if (this.check('IDENTIFIER')) {
      method = this.advance().lexeme.toUpperCase();
      const pathToken = this.consume('STRING', "Expect route path string after HTTP method");
      path = pathToken.value;
    } else {
      throw new ParserError("Expect route definition e.g. route '/api/products' ... end or route 'GET /api' { ... }", this.peek());
    }

    if (this.match('LBRACE')) {
      const body = this.blockStatements();
      return { kind: 'RouteDecl', method, path, body, loc };
    }

    // Canonical AAYU: route with method blocks or statements until 'end'
    const routeStmts: ASTNode[] = [];
    while (!this.check('END') && !this.isAtEnd()) {
      if (this.match('GET', 'POST', 'PUT', 'DELETE')) {
        const verb = this.previous().type.toUpperCase();
        const mLoc = this.loc();
        const mBody = this.parseAnyBlock();
        routeStmts.push({
          kind: 'RouteDecl',
          method: verb,
          path,
          body: mBody,
          loc: mLoc,
        });
      } else {
        routeStmts.push(this.declaration());
      }
    }
    this.consume('END', "Expect 'end' to close route block");

    if (routeStmts.length === 1 && routeStmts[0].kind === 'RouteDecl') {
      return routeStmts[0] as RouteDeclNode;
    }

    return {
      kind: 'RouteDecl',
      method,
      path,
      body: routeStmts,
      loc,
    };
  }

  private uiDeclaration(): UIDeclNode {
    const loc = this.loc();
    const widgetToken = this.advance();
    const widget = widgetToken.lexeme;

    const children: UIDeclNode[] = [];
    const props: Record<string, any> = {};

    if (this.check('IDENTIFIER')) {
      props['name'] = this.advance().lexeme;
    }

    if (this.match('LPAREN')) {
      if (this.check('STRING') || this.check('NUMBER')) {
        props['text'] = this.advance().value;
      }
      while (this.match('COMMA')) {
        if (this.check('IDENTIFIER')) {
          const k = this.advance().lexeme;
          this.match('COLON');
          if (this.check('IDENTIFIER') || this.check('STRING') || this.check('NUMBER')) {
            props[k] = this.advance().value || this.previous().lexeme;
          }
        }
      }
      this.consume('RPAREN', "Expect ')' after widget arguments");
    }

    if (this.match('LBRACE')) {
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        children.push(this.uiDeclaration());
        this.match('COMMA');
      }
      this.consume('RBRACE', "Expect '}' closing widget body");
    } else if (this.match('LBRACKET')) {
      while (!this.check('RBRACKET') && !this.isAtEnd()) {
        children.push(this.uiDeclaration());
        this.match('COMMA');
      }
      this.consume('RBRACKET', "Expect ']' closing widget children list");
    } else {
      // Canonical Flutter-like AAYU widget block: Column ... end, Page ... end
      while (!this.check('END') && !this.isAtEnd()) {
        if (this.check('PAGE', 'COLUMN', 'ROW', 'STACK', 'TEXT', 'BUTTON', 'CHART')) {
          children.push(this.uiDeclaration());
        } else {
          break;
        }
      }
      if (this.match('END')) {
        // consumed end
      }
    }

    return {
      kind: 'UIDecl',
      widget,
      props,
      children,
      loc,
    };
  }

  private statement(): ASTNode {
    if (this.match('IF')) return this.ifStatement();
    if (this.match('WHILE')) return this.whileStatement();
    if (this.match('FOR')) return this.forStatement();
    if (this.match('LOOP')) return this.loopStatement();
    if (this.match('RETURN')) return this.returnStatement();
    if (this.match('BREAK')) return this.breakStatement();
    if (this.match('CONTINUE')) return this.continueStatement();
    if (this.match('LBRACE')) return { kind: 'Program', body: this.blockStatements(), loc: this.loc() };

    return this.expressionStatement();
  }

  private ifStatement(): IfStmtNode {
    const loc = this.loc();
    const hasParen = this.match('LPAREN');
    const condition = this.expression();
    if (hasParen) {
      this.consume('RPAREN', "Expect ')' after if condition");
    }
    this.match('COLON');

    const isBrace = this.match('LBRACE');
    const thenBranch: ASTNode[] = [];
    if (isBrace) {
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        if (this.match('SEMICOLON')) continue;
        thenBranch.push(this.declaration());
      }
      this.consume('RBRACE', "Expect '}' to close if block");
    } else {
      while (!this.check('ELIF', 'ELSE', 'END') && !this.isAtEnd()) {
        if (this.match('SEMICOLON')) continue;
        thenBranch.push(this.declaration());
      }
    }

    const elifBranches: { condition: ASTNode; body: ASTNode[] }[] = [];
    while (this.match('ELIF')) {
      const elifHasParen = this.match('LPAREN');
      const elifCondition = this.expression();
      if (elifHasParen) {
        this.consume('RPAREN', "Expect ')' after elif condition");
      }
      this.match('COLON');

      const elifIsBrace = this.match('LBRACE');
      const elifBody: ASTNode[] = [];
      if (elifIsBrace) {
        while (!this.check('RBRACE') && !this.isAtEnd()) {
          if (this.match('SEMICOLON')) continue;
          elifBody.push(this.declaration());
        }
        this.consume('RBRACE', "Expect '}' to close elif block");
      } else {
        while (!this.check('ELIF', 'ELSE', 'END') && !this.isAtEnd()) {
          if (this.match('SEMICOLON')) continue;
          elifBody.push(this.declaration());
        }
      }
      elifBranches.push({ condition: elifCondition, body: elifBody });
    }

    let elseBranch: ASTNode[] | undefined;
    if (this.match('ELSE')) {
      this.match('COLON');
      const elseIsBrace = this.match('LBRACE');
      elseBranch = [];
      if (elseIsBrace) {
        while (!this.check('RBRACE') && !this.isAtEnd()) {
          if (this.match('SEMICOLON')) continue;
          elseBranch.push(this.declaration());
        }
        this.consume('RBRACE', "Expect '}' to close else block");
      } else {
        while (!this.check('END') && !this.isAtEnd()) {
          if (this.match('SEMICOLON')) continue;
          elseBranch.push(this.declaration());
        }
      }
    }

    if (!isBrace) {
      this.consume('END', "Expect 'end' to close if statement");
    }

    return {
      kind: 'IfStmt',
      condition,
      thenBranch,
      elifBranches: elifBranches.length > 0 ? elifBranches : undefined,
      elseBranch,
      loc,
    };
  }

  private whileStatement(): WhileStmtNode {
    const loc = this.loc();
    const hasParen = this.match('LPAREN');
    const condition = this.expression();
    if (hasParen) {
      this.consume('RPAREN', "Expect ')' after while condition");
    }
    this.match('COLON');
    const body = this.parseAnyBlock();

    return {
      kind: 'WhileStmt',
      condition,
      body,
      loc,
    };
  }

  private forStatement(): ForStmtNode {
    const loc = this.loc();
    const hasParen = this.match('LPAREN');
    const iterToken = this.consumeIdentifier("Expect variable name in 'for' loop");
    this.consume('IN', "Expect 'in' after loop variable");
    const iterable = this.expression();
    if (hasParen) {
      this.consume('RPAREN', "Expect ')' after for loop specification");
    }
    this.match('COLON');
    const body = this.parseAnyBlock();

    return {
      kind: 'ForStmt',
      iterator: iterToken.lexeme,
      iterable,
      body,
      loc,
    };
  }

  private loopStatement(): LoopStmtNode {
    const loc = this.loc();
    const body = this.parseAnyBlock();
    return {
      kind: 'LoopStmt',
      body,
      loc,
    };
  }

  private returnStatement(): ReturnStmtNode {
    const loc = this.loc();
    let value: ASTNode | undefined;
    if (!this.check('SEMICOLON') && !this.check('RBRACE') && !this.check('END') && !this.isAtEnd()) {
      value = this.expression();
    }
    this.match('SEMICOLON');
    return {
      kind: 'ReturnStmt',
      value,
      loc,
    };
  }

  private breakStatement(): BreakStmtNode {
    const loc = this.loc();
    this.match('SEMICOLON');
    return { kind: 'BreakStmt', loc };
  }

  private continueStatement(): ContinueStmtNode {
    const loc = this.loc();
    this.match('SEMICOLON');
    return { kind: 'ContinueStmt', loc };
  }

  private parseAnyBlock(): ASTNode[] {
    if (this.match('LBRACE')) {
      return this.blockStatements();
    }
    const statements: ASTNode[] = [];
    while (!this.check('END') && !this.isAtEnd()) {
      if (this.match('SEMICOLON')) continue;
      statements.push(this.declaration());
    }
    this.consume('END', "Expect 'end' to close block");
    return statements;
  }

  private blockOrSingleStatement(): ASTNode[] {
    if (this.match('LBRACE')) {
      return this.blockStatements();
    }
    return [this.statement()];
  }

  private block(): ASTNode[] {
    return this.parseAnyBlock();
  }

  private blockStatements(): ASTNode[] {
    const statements: ASTNode[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      if (this.match('SEMICOLON')) continue;
      statements.push(this.declaration());
    }
    this.consume('RBRACE', "Expect '}' to close block");
    return statements;
  }

  private expressionStatement(): ASTNode {
    const expr = this.expression();
    // Check if this is an assignment: target = expr or target += expr
    if (this.match('ASSIGN', 'PLUS_ASSIGN', 'MINUS_ASSIGN')) {
      const op = this.previous().lexeme as '=' | '+=' | '-=';
      const value = this.expression();
      this.match('SEMICOLON');
      return {
        kind: 'Assignment',
        target: expr,
        value,
        operator: op,
        loc: expr.loc,
      };
    }
    this.match('SEMICOLON');
    return {
      kind: 'ExpressionStmt',
      expression: expr,
      loc: expr.loc,
    };
  }

  private expression(): ASTNode {
    return this.logicOr();
  }

  private logicOr(): ASTNode {
    let expr = this.logicAnd();
    while (this.match('OR')) {
      const operator = this.previous().lexeme;
      const right = this.logicAnd();
      expr = {
        kind: 'BinaryExpr',
        operator: 'or',
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private logicAnd(): ASTNode {
    let expr = this.equality();
    while (this.match('AND')) {
      const right = this.equality();
      expr = {
        kind: 'BinaryExpr',
        operator: 'and',
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();
    while (this.match('EQ', 'NEQ')) {
      const operator = this.previous().lexeme;
      const right = this.comparison();
      expr = {
        kind: 'BinaryExpr',
        operator,
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();
    while (this.match('GT', 'GTE', 'LT', 'LTE')) {
      const operator = this.previous().lexeme;
      const right = this.term();
      expr = {
        kind: 'BinaryExpr',
        operator,
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();
    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().lexeme;
      const right = this.factor();
      expr = {
        kind: 'BinaryExpr',
        operator,
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private factor(): ASTNode {
    let expr = this.power();
    while (this.match('STAR', 'SLASH', 'PERCENT')) {
      const operator = this.previous().lexeme;
      const right = this.power();
      expr = {
        kind: 'BinaryExpr',
        operator,
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private power(): ASTNode {
    let expr = this.unary();
    while (this.match('CARET')) {
      const operator = '^';
      const right = this.unary();
      expr = {
        kind: 'BinaryExpr',
        operator,
        left: expr,
        right,
        loc: expr.loc,
      };
    }
    return expr;
  }

  private unary(): ASTNode {
    if (this.match('NOT', 'MINUS')) {
      const operator = this.previous().lexeme;
      const operand = this.unary();
      return {
        kind: 'UnaryExpr',
        operator,
        operand,
        loc: operand.loc,
      };
    }
    return this.callOrIndex();
  }

  private callOrIndex(): ASTNode {
    let expr = this.primary();

    while (true) {
      if (this.match('LPAREN')) {
        expr = this.finishCall(expr);
      } else if (this.match('LBRACKET')) {
        const index = this.expression();
        this.consume('RBRACKET', "Expect ']' after index");
        expr = {
          kind: 'IndexExpr',
          target: expr,
          index,
          loc: expr.loc,
        };
      } else if (this.match('DOT')) {
        const nameToken = this.consumeIdentifier('Expect property or method name after .');
        if (this.match('LPAREN')) {
          // Method call e.g. arr.len(), arr.push(item)
          const args: ASTNode[] = [];
          if (!this.check('RPAREN')) {
            do {
              args.push(this.expression());
            } while (this.match('COMMA'));
          }
          this.consume('RPAREN', "Expect ')' after method arguments");
          expr = {
            kind: 'CallExpr',
            callee: {
              kind: 'IdentifierExpr',
              name: `${(expr as any).name || 'obj'}.${nameToken.lexeme}`,
              loc: expr.loc,
            },
            args: [expr, ...args],
            loc: expr.loc,
          };
        } else {
          expr = {
            kind: 'IndexExpr',
            target: expr,
            index: { kind: 'LiteralExpr', value: nameToken.lexeme, rawType: 'string', loc: expr.loc },
            loc: expr.loc,
          };
        }
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: ASTNode): ASTNode {
    const args: ASTNode[] = [];
    if (!this.check('RPAREN')) {
      do {
        args.push(this.expression());
      } while (this.match('COMMA'));
    }
    this.consume('RPAREN', "Expect ')' after arguments");
    return {
      kind: 'CallExpr',
      callee,
      args,
      loc: callee.loc,
    };
  }

  private primary(): ASTNode {
    const loc = this.loc();

    if (this.match('TRUE')) {
      return { kind: 'LiteralExpr', value: true, rawType: 'boolean', loc };
    }
    if (this.match('FALSE')) {
      return { kind: 'LiteralExpr', value: false, rawType: 'boolean', loc };
    }
    if (this.match('NULL')) {
      return { kind: 'LiteralExpr', value: null, rawType: 'null', loc };
    }
    if (this.match('NUMBER')) {
      return { kind: 'LiteralExpr', value: this.previous().value, rawType: 'number', loc };
    }
    if (this.match('STRING')) {
      return { kind: 'LiteralExpr', value: this.previous().value, rawType: 'string', loc };
    }
    // Handle find expression: find Model [where ...]
    if (this.check('FIND') && this.current + 1 < this.tokens.length && this.isIdentifierToken(this.tokens[this.current + 1].type)) {
      this.advance();
      return this.findStatement();
    }
    if (this.checkIdentifier()) {
      return { kind: 'IdentifierExpr', name: this.advance().lexeme, loc };
    }
    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.consume('RPAREN', "Expect ')' after expression");
      return expr;
    }
    // Array literal: [1, 2, 3]
    if (this.match('LBRACKET')) {
      const elements: ASTNode[] = [];
      if (!this.check('RBRACKET')) {
        do {
          elements.push(this.expression());
        } while (this.match('COMMA'));
      }
      this.consume('RBRACKET', "Expect ']' to close array literal");
      return {
        kind: 'ArrayExpr',
        elements,
        loc,
      };
    }
    // Dict/Map literal: { "a": 1, "b": 2 }
    if (this.match('LBRACE')) {
      const entries: { key: string; value: ASTNode }[] = [];
      if (!this.check('RBRACE')) {
        do {
          let key = '';
          if (this.check('STRING')) {
            key = this.advance().value;
          } else if (this.checkIdentifier()) {
            key = this.advance().lexeme;
          } else {
            throw new ParserError('Expect dictionary key (string or identifier)', this.peek());
          }
          this.consume('COLON', "Expect ':' after dictionary key");
          const val = this.expression();
          entries.push({ key, value: val });
        } while (this.match('COMMA'));
      }
      this.consume('RBRACE', "Expect '}' to close dictionary literal");
      return {
        kind: 'DictExpr',
        entries,
        loc,
      };
    }

    throw new ParserError(`Unexpected expression token '${this.peek().lexeme || this.peek().type}'`, this.peek());
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(...types: TokenType[]): boolean {
    if (this.isAtEnd()) return false;
    return types.includes(this.peek().type);
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isIdentifierToken(type: TokenType): boolean {
    if (type === 'IDENTIFIER') return true;
    const contextual: TokenType[] = [
      'MODEL', 'APP', 'RUN', 'RESPOND', 'GET', 'POST', 'PUT',
      'FIND', 'INSERT', 'UPDATE', 'DELETE', 'WHERE',
      'PAGE', 'COLUMN', 'ROW', 'STACK', 'TEXT', 'BUTTON', 'CHART',
      'PRINT', 'PRINTLN', 'AS', 'FROM'
    ];
    return contextual.includes(type);
  }

  private checkIdentifier(): boolean {
    if (this.isAtEnd()) return false;
    return this.isIdentifierToken(this.peek().type);
  }

  private consumeIdentifier(message: string): Token {
    if (this.checkIdentifier()) return this.advance();
    throw new ParserError(message, this.peek());
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParserError(message, this.peek());
  }

  private loc(): SourceLocation {
    const t = this.peek();
    return { line: t.line, column: t.column };
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === 'SEMICOLON') return;
      switch (this.peek().type) {
        case 'LET':
        case 'MUT':
        case 'FN':
        case 'IF':
        case 'WHILE':
        case 'FOR':
        case 'RETURN':
        case 'MODEL':
        case 'ROUTE':
          return;
      }
      this.advance();
    }
  }
}
