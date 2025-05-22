import ts from 'typescript';
import { isMuFunc, isMuProc } from './utils';

const impureGlobalFunctions = new Set([
  "console.log", "console.error", "console.warn",
  "alert", "prompt", "confirm",
  "fetch", "XMLHttpRequest",
  "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "document", "window",
  "localStorage", "sessionStorage", "indexedDB",
  "Date.now",
  "Math.random"
]);



export function checkPurity(
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  diagnostics: ts.DiagnosticWithLocation[],
  currentFuncParameters: readonly ts.ParameterDeclaration[]
) {
  // Check for specific impure function calls
  if (ts.isCallExpression(node)) {
    const calledExpression = node.expression;
    const calledName = calledExpression.getText(sourceFile);

    // Allow our custom JSX factory calls (mu.elt) as they are part of the pure rendering process.
    if (ts.isPropertyAccessExpression(calledExpression) &&
      ts.isIdentifier(calledExpression.expression) && calledExpression.expression.text === "mu" &&
      calledExpression.name.text === "elt") {
      return; // This call is considered pure, so return and don't check children as impure
    }

    const signature = typeChecker.getResolvedSignature(node);
    if (signature) {
      const declaration = signature.declaration;
      if (declaration) {
        const isMuFuncCalled = isMuFunc(declaration);
        const isMuProcCalled = isMuProc(declaration);

        if (isMuProcCalled) {
          diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1008, messageText: `Impure operation: 'func' cannot call 'proc' as 'proc' may have side effects.` });
          return;
        }
        if (!isMuFuncCalled) {
          diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1007, messageText: `Impure operation (calling external impure function '${calledName}') not allowed in 'func' declarations.` });
        }
      } else { // No declaration found (global built-ins etc.)
        if (impureGlobalFunctions.has(calledName)) { // Direct identifier or property access check
          diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1002, messageText: `Impure operation (e.g., I/O call '${calledName}') not allowed in 'func' declarations.` });
        } else {
          // Generic check for other external calls not recognized as pure Mu 'func'
          diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1007, messageText: `Impure operation (calling external impure function '${calledName}') not allowed in 'func' declarations.` });
        }
      }
    }
  }

  // Check for assignments that might be impure (e.g., global variable modification, argument mutation)
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    if (ts.isIdentifier(node.left)) {
      const identifierName = node.left.text;
      const isParameter = currentFuncParameters.some(param => param.name.getText(sourceFile) === identifierName);
      if (!isParameter) {
        diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1003, messageText: `Impure operation (modifying non-local state '${identifierName}') not allowed in 'func' declarations.` });
      }
    } else if (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left)) {
      const baseExpression = ts.isPropertyAccessExpression(node.left) ? node.left.expression : node.left.expression;
      if (ts.isIdentifier(baseExpression)) {
        const baseName = baseExpression.text;
        const isParameter = currentFuncParameters.some(param => param.name.getText(sourceFile) === baseName);
        if (isParameter) {
          diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1005, messageText: `Impure operation (modifying function argument '${baseName}') not allowed in 'func' declarations.` });
          return;
        }
      }
      diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1004, messageText: "Impure operation (modifying external objects/arguments) not allowed in 'func' declarations." });
    }
  }

  // Check for mutating method calls on arguments
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const methodName = node.expression.name.text;
    const objectBeingCalledOn = node.expression.expression;
    if (ts.isIdentifier(objectBeingCalledOn)) {
      const objectName = objectBeingCalledOn.text;
      const isParameter = currentFuncParameters.some(param => param.name.getText(sourceFile) === objectName);
      const mutatingMethods = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin", "set"]);
      if (isParameter && mutatingMethods.has(methodName)) {
        diagnostics.push({ file: sourceFile, start: node.getStart(), length: node.getWidth(), category: ts.DiagnosticCategory.Error, code: 1006, messageText: `Impure operation (calling mutating method '${methodName}' on argument '${objectName}') not allowed in 'func' declarations.` });
        return;
      }
    }
  }

  // This loop ensures checkPurity traverses all children.
  ts.forEachChild(node, child => checkPurity(typeChecker, child, sourceFile, diagnostics, currentFuncParameters));
}
