/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Architecture Graph & Mermaid Generator
 * Powers the visual architecture explorer and dependency tree visualizer.
 */

import { ProgramNode, ASTNode, ExecutionResult } from './types';

export interface ArchitectureNode {
  id: string;
  type: 'app' | 'model' | 'route' | 'action' | 'ui' | 'import';
  label: string;
  details: string;
  badge?: string;
  color: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  mermaidCode: string;
}

export class AayuGraphGenerator {
  static generate(ast: ProgramNode | null, result?: ExecutionResult | null): ArchitectureGraph {
    const nodes: ArchitectureNode[] = [];
    const edges: ArchitectureEdge[] = [];

    let appName = result?.appName || 'AAYU Application';
    let hasExplicitApp = false;

    // Scan AST
    if (ast && ast.body) {
      for (const node of ast.body) {
        if (node.kind === 'AppDecl') {
          appName = node.name;
          hasExplicitApp = true;
        }
      }
    }

    const appId = 'app_root';
    nodes.push({
      id: appId,
      type: 'app',
      label: `App: ${appName}`,
      details: 'Root Silicon Application Container',
      badge: 'SILICON ROOT',
      color: '#3b82f6',
    });

    if (ast && ast.body) {
      for (const node of ast.body) {
        switch (node.kind) {
          case 'ModelDecl': {
            const mId = `model_${node.name}`;
            const fieldList = node.fields.map(f => `${f.name}: ${f.type}`).join(', ');
            nodes.push({
              id: mId,
              type: 'model',
              label: `Model: ${node.name}`,
              details: fieldList || 'In-Memory Schema',
              badge: `${node.fields.length} FIELDS`,
              color: '#f59e0b',
            });
            edges.push({ from: appId, to: mId, label: 'schema' });
            break;
          }

          case 'RouteDecl': {
            const rId = `route_${node.method}_${node.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
            nodes.push({
              id: rId,
              type: 'route',
              label: `${node.method} ${node.path}`,
              details: `REST API Endpoint (${node.body.length} stmts)`,
              badge: node.method,
              color: node.method === 'POST' ? '#10b981' : node.method === 'DELETE' ? '#ef4444' : '#06b6d4',
            });
            edges.push({ from: appId, to: rId, label: 'serves' });
            break;
          }

          case 'FunctionDecl': {
            const fId = `action_${node.name}`;
            const paramStr = node.params.length > 0 ? `(${node.params.join(', ')})` : '()';
            nodes.push({
              id: fId,
              type: 'action',
              label: `action ${node.name}${paramStr}`,
              details: `Compiled Bytecode Action (${node.body.length} stmts)`,
              badge: 'ACTION',
              color: '#8b5cf6',
            });
            edges.push({ from: appId, to: fId, label: 'executes' });
            break;
          }

          case 'UIDecl': {
            const uId = `ui_${node.widget}_${node.props?.name || 'main'}`;
            nodes.push({
              id: uId,
              type: 'ui',
              label: `UI: ${node.widget} ${node.props?.name || ''}`,
              details: `Declarative UI (${node.children?.length || 0} children)`,
              badge: 'WIDGET',
              color: '#ec4899',
            });
            edges.push({ from: appId, to: uId, label: 'mounts' });
            break;
          }

          case 'RunStmt': {
            // Find target action or UI
            const targetId = `action_${node.target}`;
            const targetNode = nodes.find(n => n.id === targetId);
            if (targetNode) {
              targetNode.badge = '★ ENTRYPOINT';
            }
            break;
          }
        }
      }
    }

    // Merge registered routes from VM execution if any were registered dynamically
    if (result && result.registeredRoutes) {
      for (const r of result.registeredRoutes) {
        const rId = `route_${r.method}_${r.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (!nodes.some(n => n.id === rId)) {
          nodes.push({
            id: rId,
            type: 'route',
            label: `${r.method} ${r.path}`,
            details: 'Live Registered REST API Endpoint',
            badge: r.method,
            color: '#10b981',
          });
          edges.push({ from: appId, to: rId, label: 'serves' });
        }
      }
    }

    // Build Mermaid Code
    const mermaidLines: string[] = [
      'graph TD',
      '    classDef app fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff;',
      '    classDef model fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff;',
      '    classDef route fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;',
      '    classDef action fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff;',
      '    classDef ui fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fff;',
      '',
    ];

    for (const node of nodes) {
      const safeLabel = node.label.replace(/"/g, "'");
      const safeBadge = node.badge ? ` [${node.badge}]` : '';
      mermaidLines.push(`    ${node.id}["${safeLabel}${safeBadge}"]:::${node.type}`);
    }

    mermaidLines.push('');
    for (const edge of edges) {
      if (edge.label) {
        mermaidLines.push(`    ${edge.from} -->|"${edge.label}"| ${edge.to}`);
      } else {
        mermaidLines.push(`    ${edge.from} --> ${edge.to}`);
      }
    }

    return {
      nodes,
      edges,
      mermaidCode: mermaidLines.join('\n'),
    };
  }
}
