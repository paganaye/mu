import ts, { Statement } from 'typescript';
import { isMuFunc, isMuProc, createMuEltCall, throwIfDiagnosticsNotEmpty } from './utils';
import { checkPurity } from './checkPurity';

export class MuTransformer {
  private factory: ts.NodeFactory;
  private needsRxjsFromImport = false;
  private hasRxjsFromImport = false;

  constructor(readonly typeChecker: ts.TypeChecker, readonly context: ts.TransformationContext) {
    this.factory = context.factory;
  }

  private visitor: ts.Visitor = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === 'rxjs') {
      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        if (node.importClause.namedBindings.elements.some(element => element.name.text === 'from')) {
          this.hasRxjsFromImport = true;
        }
      }
    }

    // --- Handle JSX Node Transformation (mu.elt creation) ---
    if (ts.isJsxElement(node)) {
        return createMuEltCall(this.factory, node.openingElement.tagName, node.openingElement.attributes, node.children, this.visitor, this.context);
    } else if (ts.isJsxSelfClosingElement(node)) {
        return createMuEltCall(this.factory, node.tagName, node.attributes, undefined, this.visitor, this.context);
    } else if (ts.isJsxFragment(node)) {
        return createMuEltCall(this.factory, this.factory.createPropertyAccessExpression(this.factory.createIdentifier("mu"), this.factory.createIdentifier("Fragment")), null, node.children, this.visitor, this.context);
    } else if (ts.isJsxText(node)) {
        const trimmedText = node.text.trim();
        if (trimmedText === "") {
            return undefined;
        }
        return this.factory.createStringLiteral(trimmedText);
    } else if (ts.isJsxExpression(node)) {
        if (node.expression) {
            return ts.visitNode(node.expression, this.visitor); // Correct usage of ts.visitNode
        }
        return undefined;
    }

    // --- Process Function Declarations (func and proc) ---
    if (ts.isFunctionDeclaration(node)) {
      const isMuFuncNode = isMuFunc(node);
      const isMuProcNode = isMuProc(node);

      const functionDiagnostics: ts.DiagnosticWithLocation[] = [];

      if (isMuFuncNode) {
        if (node.body) {
          checkPurity(this.typeChecker, node.body, node.getSourceFile(), functionDiagnostics, node.parameters);
        }

        throwIfDiagnosticsNotEmpty(functionDiagnostics);

        this.needsRxjsFromImport = true;

        const transformedBody = this.factory.createBlock(
          // CORRECTED: Apply visitor to each statement in the map, using ts.visitNode
          node.body?.statements.map(statement => {
            const visitedStatement = ts.visitNode(statement, this.visitor); // Correct usage of ts.visitNode
            if (visitedStatement) {
              if (ts.isReturnStatement(visitedStatement) && visitedStatement.expression) {
                return this.factory.createReturnStatement(
                  this.factory.createCallExpression(
                    this.factory.createIdentifier("from"),
                    undefined,
                    [this.factory.createArrayLiteralExpression([visitedStatement.expression])]
                  )
                );
              }
              return visitedStatement;
            }
            return statement;
          }) as Statement[] || [],
          true
        );

        return this.factory.updateFunctionDeclaration(
          node,
          node.modifiers,
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          transformedBody
        );
      } else if (isMuProcNode) {
        const currentModifiers = node.modifiers ? [...node.modifiers] : [];
        if (!currentModifiers.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) {
          currentModifiers.push(this.factory.createModifier(ts.SyntaxKind.AsyncKeyword));
        }

        const transformedBody = this.factory.createBlock(
          // CORRECTED: Apply visitor to each statement in the map, using ts.visitNode
          node.body?.statements.map(statement => {
            const visitedStatement = ts.visitNode(statement, this.visitor); // Correct usage of ts.visitNode
            if (visitedStatement) {
              if (ts.isVariableStatement(visitedStatement)) {
                return this.factory.updateVariableStatement(
                  visitedStatement,
                  visitedStatement.modifiers,
                  this.factory.updateVariableDeclarationList(
                    visitedStatement.declarationList,
                    visitedStatement.declarationList.declarations.map(decl => {
                      if (decl.initializer) {
                        // CORRECTED: Use ts.visitNode for initializer
                        const transformedInitializer = ts.visitNode(decl.initializer, this.visitor) as ts.Expression;
                        const isAwaitableCall = ts.isCallExpression(transformedInitializer) &&
                          ((ts.isIdentifier(transformedInitializer.expression) && (transformedInitializer.expression.text === 'fetch')) ||
                            (ts.isPropertyAccessExpression(transformedInitializer.expression) && (transformedInitializer.expression.name.text === 'json' || transformedInitializer.expression.name.text === 'text')));

                        if (isAwaitableCall) {
                          return this.factory.updateVariableDeclaration(
                            decl, decl.name, decl.exclamationToken, decl.type, this.factory.createAwaitExpression(transformedInitializer)
                          );
                        }
                        return this.factory.updateVariableDeclaration(
                          decl, decl.name, decl.exclamationToken, decl.type, transformedInitializer
                        );
                      }
                      return decl;
                    })
                  )
                );
              } else if (ts.isExpressionStatement(visitedStatement)) {
                // CORRECTED: Use ts.visitNode for expression
                const transformedExpression = ts.visitNode(visitedStatement.expression, this.visitor) as ts.Expression;
                if (ts.isCallExpression(transformedExpression)) {
                  const callExpression = transformedExpression;
                  const isAwaitable = (ts.isIdentifier(callExpression.expression) && (callExpression.expression.text === 'fetch')) ||
                    (ts.isPropertyAccessExpression(callExpression.expression) && (callExpression.expression.name.text === 'json' || callExpression.expression.name.text === 'text'));

                  if (isAwaitable) {
                    return this.factory.updateExpressionStatement(
                      visitedStatement,
                      this.factory.createAwaitExpression(callExpression)
                    );
                  }
                }
                return visitedStatement;
              }
              return visitedStatement;
            }
            return statement;
          }) as Statement[] || [],
          true
        );

        return this.factory.updateFunctionDeclaration(
          node,
          currentModifiers,
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          transformedBody
        );
      }
    }

    // Default: Recursively visit child nodes for any other processing
    return ts.visitEachChild(node, this.visitor, this.context);
  };

  public transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformedSourceFile = ts.visitNode(sourceFile, this.visitor) as ts.SourceFile;

    if (this.needsRxjsFromImport && !this.hasRxjsFromImport) {
      const fromImport = this.factory.createImportDeclaration(
        undefined,
        this.factory.createImportClause(
          false,
          undefined,
          this.factory.createNamedImports([
            this.factory.createImportSpecifier(false, undefined, this.factory.createIdentifier("from"))
          ])
        ),
        this.factory.createStringLiteral("rxjs")
      );
      return this.factory.updateSourceFile(
        transformedSourceFile,
        [fromImport, ...transformedSourceFile.statements]
      );
    }

    return transformedSourceFile;
  };
}