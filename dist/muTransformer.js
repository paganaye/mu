"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.muTransformer = muTransformer;
const typescript_1 = __importDefault(require("typescript"));
/**
 * Custom transformer for Mu language features.
 * This transformer identifies 'func' and 'proc' markers
 * and transforms their AST nodes accordingly.
 */
function muTransformer(typeChecker, context) {
    const { factory } = context;
    let needsRxjsFromImport = false;
    let hasRxjsFromImport = false;
    // List of known impure global functions/methods (simplified)
    // This list can be expanded significantly.
    const impureGlobalFunctions = new Set([
        "console.log", "console.error", "console.warn",
        "alert", "prompt", "confirm",
        "fetch", "XMLHttpRequest",
        "setTimeout", "setInterval", "clearTimeout", "clearInterval",
        // Accessing properties of `document` or `window` for mutation is impure.
        // Checking direct identifier references to `document` or `window` as impure function access.
        // For deeper analysis, context/type checker is needed.
        "document", "window",
        "localStorage", "sessionStorage", "indexedDB"
    ]);
    // Function to check if a node or its children contain impure operations for 'func'
    // It now takes the parameters of the current function for basic scope check.
    function checkPurity(node, sourceFile, diagnostics, currentFuncParameters) {
        // Check for specific impure function calls
        if (typescript_1.default.isCallExpression(node)) {
            const signature = typeChecker.getResolvedSignature(node);
            const calledExpression = node.expression;
            const calledName = calledExpression.getText(sourceFile);
            if (signature) {
                const declaration = signature.declaration;
                // Case 1: The called function has a declaration in the current program
                if (declaration) {
                    // Check if the called function is a Mu 'func' or 'proc'
                    const leadingComments = typescript_1.default.getLeadingCommentRanges(sourceFile.getFullText(), declaration.pos);
                    const isMuFuncCalled = leadingComments?.some(comment => sourceFile.text.substring(comment.pos, comment.end).includes('MU_FUNC'));
                    const isMuProcCalled = leadingComments?.some(comment => sourceFile.text.substring(comment.pos, comment.end).includes('MU_PROC'));
                    if (isMuProcCalled) {
                        // CRITICAL RULE: A 'func' cannot call a 'proc'
                        diagnostics.push({
                            file: sourceFile,
                            start: node.getStart(),
                            length: node.getWidth(),
                            category: typescript_1.default.DiagnosticCategory.Error,
                            code: 1008, // NEW error code for func calling proc
                            messageText: `Impure operation: 'func' cannot call 'proc' as 'proc' may have side effects.`
                        });
                        // Prevent further purity checks on this call expression if already identified as impure
                        return;
                    }
                    if (!isMuFuncCalled) {
                        // It's a standard JS function declaration, not a Mu 'func', and not a Mu 'proc' (already handled).
                        // So, it's an external impure function call.
                        diagnostics.push({
                            file: sourceFile,
                            start: node.getStart(),
                            length: node.getWidth(),
                            category: typescript_1.default.DiagnosticCategory.Error,
                            code: 1007,
                            messageText: `Impure operation (calling external impure function '${calledName}') not allowed in 'func' declarations.`
                        });
                    }
                }
                else {
                    // Case 2: The called function has no declaration in the current program (e.g., global built-in, or external import)
                    // This covers `Date.now()`, `Math.random()`, `externalImpureFunction()` from previous test.
                    // We'll consider these impure by default unless explicitly marked pure (future feature).
                    // If it's a direct identifier call (e.g., `externalImpureFunction()`)
                    if (typescript_1.default.isIdentifier(calledExpression)) {
                        if (!impureGlobalFunctions.has(calledName)) { // Avoid duplicate errors if already in list
                            diagnostics.push({
                                file: sourceFile,
                                start: node.getStart(),
                                length: node.getWidth(),
                                category: typescript_1.default.DiagnosticCategory.Error,
                                code: 1007,
                                messageText: `Impure operation (calling external impure function '${calledName}') not allowed in 'func' declarations.`
                            });
                        }
                    }
                    else if (typescript_1.default.isPropertyAccessExpression(calledExpression)) {
                        // For method calls like `obj.method()`, `Date.now()`.
                        if (impureGlobalFunctions.has(calledName)) {
                            diagnostics.push({
                                file: sourceFile,
                                start: node.getStart(),
                                length: node.getWidth(),
                                category: typescript_1.default.DiagnosticCategory.Error,
                                code: 1002,
                                messageText: `Impure operation (e.g., I/O call '${calledName}') not allowed in 'func' declarations.`
                            });
                        }
                        else {
                            // If it's a method call not explicitly in impureGlobalFunctions,
                            // and it's not a known Mu func, we'll also flag it as impure.
                            diagnostics.push({
                                file: sourceFile,
                                start: node.getStart(),
                                length: node.getWidth(),
                                category: typescript_1.default.DiagnosticCategory.Error,
                                code: 1007,
                                messageText: `Impure operation (calling external impure method '${calledName}') not allowed in 'func' declarations.`
                            });
                        }
                    }
                }
            }
        }
        // Check for assignments that might be impure (e.g., global variable modification)
        if (typescript_1.default.isBinaryExpression(node) && node.operatorToken.kind === typescript_1.default.SyntaxKind.EqualsToken) {
            if (typescript_1.default.isIdentifier(node.left)) {
                const identifierName = node.left.text;
                // Check if the identifier is one of the parameters of the current `func`
                const isParameter = currentFuncParameters.some(param => param.name.getText(sourceFile) === identifierName);
                // If it's an assignment to an identifier that is NOT a parameter,
                // it's likely a global variable or captured variable, which is impure for 'func'.
                // This is still a heuristic without full scope analysis via TypeChecker.
                if (!isParameter) {
                    diagnostics.push({
                        file: sourceFile,
                        start: node.getStart(),
                        length: node.getWidth(),
                        category: typescript_1.default.DiagnosticCategory.Error,
                        code: 1003,
                        messageText: `Impure operation (modifying non-local state '${identifierName}') not allowed in 'func' declarations.`
                    });
                }
            }
            else if (typescript_1.default.isPropertyAccessExpression(node.left) || typescript_1.default.isElementAccessExpression(node.left)) {
                // Assignment to a property of an object (e.g., `obj.x = ...` or `arr[0] = ...`)
                // This is impure for 'func' as it modifies external objects/arguments.
                diagnostics.push({
                    file: sourceFile,
                    start: node.getStart(),
                    length: node.getWidth(),
                    category: typescript_1.default.DiagnosticCategory.Error,
                    code: 1004,
                    messageText: "Impure operation (modifying external objects/arguments) not allowed in 'func' declarations."
                });
            }
        }
        typescript_1.default.forEachChild(node, child => checkPurity(child, sourceFile, diagnostics, currentFuncParameters));
    }
    const visitor = (node) => {
        if (typescript_1.default.isImportDeclaration(node) && typescript_1.default.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === 'rxjs') {
            if (node.importClause?.namedBindings && typescript_1.default.isNamedImports(node.importClause.namedBindings)) {
                if (node.importClause.namedBindings.elements.some(element => element.name.text === 'from')) {
                    hasRxjsFromImport = true;
                }
            }
        }
        if (typescript_1.default.isFunctionDeclaration(node)) {
            const leadingComments = typescript_1.default.getLeadingCommentRanges(node.getSourceFile().getFullText(), node.pos);
            const isMuFunc = leadingComments?.some(comment => node.getSourceFile().text.substring(comment.pos, comment.end).includes('MU_FUNC'));
            const isMuProc = leadingComments?.some(comment => node.getSourceFile().text.substring(comment.pos, comment.end).includes('MU_PROC'));
            // Collect diagnostics for the current function scope
            const functionDiagnostics = [];
            if (isMuFunc) {
                // Run purity checks on the function body
                if (node.body) {
                    // Pass the function's parameters to the purity checker
                    checkPurity(node.body, node.getSourceFile(), functionDiagnostics, node.parameters);
                }
                // If impure operations are found, throw the first one to fail the test.
                // In a real compiler, you'd collect all and report them.
                if (functionDiagnostics.length > 0) {
                    throw new Error(functionDiagnostics[0].messageText);
                }
                needsRxjsFromImport = true;
                const transformedBody = factory.createBlock(node.body?.statements.map(statement => {
                    if (typescript_1.default.isReturnStatement(statement) && statement.expression) {
                        return factory.createReturnStatement(factory.createCallExpression(factory.createIdentifier("from"), undefined, [factory.createArrayLiteralExpression([statement.expression])]));
                    }
                    return statement;
                }) || [], true);
                return factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, transformedBody);
            }
            else if (isMuProc) {
                const currentModifiers = node.modifiers ? [...node.modifiers] : [];
                if (!currentModifiers.some(m => m.kind === typescript_1.default.SyntaxKind.AsyncKeyword)) {
                    currentModifiers.push(factory.createModifier(typescript_1.default.SyntaxKind.AsyncKeyword));
                }
                const transformedBody = factory.createBlock(node.body?.statements.map(statement => {
                    if (typescript_1.default.isVariableStatement(statement)) {
                        return factory.updateVariableStatement(statement, statement.modifiers, factory.updateVariableDeclarationList(statement.declarationList, statement.declarationList.declarations.map(decl => {
                            if (decl.initializer && typescript_1.default.isCallExpression(decl.initializer)) {
                                return factory.updateVariableDeclaration(decl, decl.name, decl.exclamationToken, decl.type, factory.createAwaitExpression(decl.initializer));
                            }
                            return decl;
                        })));
                    }
                    else if (typescript_1.default.isExpressionStatement(statement) && typescript_1.default.isCallExpression(statement.expression)) {
                        return factory.updateExpressionStatement(statement, factory.createAwaitExpression(statement.expression));
                    }
                    return statement;
                }) || [], true);
                return factory.updateFunctionDeclaration(node, currentModifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, transformedBody);
            }
        }
        // Important: Visit children of the current node to continue traversal.
        // Only visit if it's not a function declaration we just processed, or if it's not the body of a func/proc
        // that we already specifically handled its children in `checkPurity`.
        return typescript_1.default.visitEachChild(node, visitor, context);
    };
    return (sourceFile) => {
        const transformedSourceFile = typescript_1.default.visitNode(sourceFile, visitor);
        if (needsRxjsFromImport && !hasRxjsFromImport) {
            const fromImport = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([
                factory.createImportSpecifier(false, undefined, factory.createIdentifier("from"))
            ])), factory.createStringLiteral("rxjs"));
            return factory.updateSourceFile(transformedSourceFile, [fromImport, ...transformedSourceFile.statements]);
        }
        return transformedSourceFile;
    };
}
