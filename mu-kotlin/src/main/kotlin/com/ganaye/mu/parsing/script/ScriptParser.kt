package com.ganaye.mu.parsing.script

import com.ganaye.mu.parsing.BaseParser
import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.UnexpectedToken
import com.ganaye.mu.parsing.script.Statement.AssignStatement
import com.ganaye.mu.parsing.script.Statement.ReturnStatement as ReturnStatement1

class ScriptParser(context: Context) : BaseParser<ScriptToken, Statement>(context, context.scriptTokenizer) {
    fun parseScript(): Statement.ScriptBlock {
        tokenizer.clearToken()
        return parseBlock(true)
    }

    private fun parseBlock(isRoot: Boolean): Statement.ScriptBlock {
        var curToken = this.curToken
        val lines = mutableListOf<Statement>()

        while (curToken !is ScriptToken.Eof) {
            if (this.curToken.operator == Operator.close_curly_brackets
                || this.curToken.operator == Operator.end_script_tag
            ) break
            val line = parseSingleLine()
            lines.add(line)
            curToken = this.curToken
        }
        return Statement.ScriptBlock(lines, isRoot)
    }

    private fun skipSemiColon() {
        if (curToken.operator == Operator.semi_colon) nextToken()
    }

    private fun parseSingleLine(): Statement {
        val curToken = this.curToken
        try {
            when (curToken) {
                is ScriptToken.Identifier -> {
                    val line = parseIdentifierLine(curToken)
                    return line
                }

                else -> {
                    if (this.curToken.operator == Operator.semi_colon) {
                        nextToken()
                        return Statement.ScriptBlock(emptyList())
                    } else return parseExprLine(curToken)
                }
            }
        } finally {
            skipSemiColon()
        }
    }

    private fun parseIdentifierLine(identifierToken: ScriptToken.Identifier): Statement {
        return when (identifierToken.identifier) {
            "const" -> {
                nextToken();
                return parseDeclaration(DeclarationType.Const)
            }

            "for" -> parseFor()
            "function" -> parseFunction()
            "if" -> parseIf()
            "let" -> {
                nextToken();
                return parseDeclaration(DeclarationType.Let)
            }

            "return" -> parseReturn()
            "switch" -> parseSwitch()
            "try" -> parseTry()
            "var" -> {
                nextToken(); return parseDeclaration(DeclarationType.Var)
            }

            "while" -> parseWhile()
            "class" -> parseClass()
            else -> {
                return parseExprLine(identifierToken)
            }
        }

    }

    fun parseExprLine(fromToken: ScriptToken): Statement {
        val leftExpr = parseExpr(fromToken)
        val curToken = this.curToken
        if (curToken is ScriptToken.OpToken && curToken.operator.assign) {
            return parseAssign(leftExpr)
        } else {
            return Statement.VoidExprLine(leftExpr)
        }
    }

    fun parseAssign(writableValue: Expr): Statement {
        val op = (curToken as ScriptToken.OpToken).operator
        val right: Expr?
        when (op) {
            Operator.postfix_inc,  //  ++         Postfix Increment i++
            Operator.postfix_dec,  //  --         Postfix Decrement i--
            Operator.prefix_dec,   //  ++         Prefix Increment ++i
            Operator.prefix_inc -> //  --         Prefix Decrement --i
            {
                right = null
            }

            else -> {
//            ScriptOperator.assign -> {} //                     =          Simple Assignment x = y
//            ScriptOperator.colon_assign -> {} //               :          Colon Assignment x: 5
//            ScriptOperator.plus_assign -> {} //                +=         Addition Assignment x += y
//            ScriptOperator.minus_assign -> {} //               -=         Subtraction Assignment x -= y
//            ScriptOperator.multiply_assign -> {} //            *=         Multiplication Assignment x *= y
//            ScriptOperator.exponent_assign -> {} //            **=        Exponentiation Assignment x **= y
//            ScriptOperator.divide_assign -> {} //              /=         Division Assignment x /= y
//            ScriptOperator.modulo_assign -> {} //              %=         Remainder Assignment x %= y
//            ScriptOperator.leftShift_assign -> {} //           <<=        Left Shift Assignment x <<= y
//            ScriptOperator.right_shift_assign -> {} //         >>=        Right Shift Assignment x >>= y
//            ScriptOperator.unsigned_right_shift_assign -> {} //>>>=       Unsigned Right Shift x >>>= y
//            ScriptOperator.bitwise_and_assign -> {} //         &=         Bitwise AND Assignment x &= y
//            ScriptOperator.bitwise_or_assign -> {} //          |=         Bitwise OR Assignment x |= y
//            ScriptOperator.bitwise_xor_assign -> {} //         ^=         Bitwise XOR Assignment x ^= y
//            ScriptOperator.logical_and_assign -> {} //         &&=        Logical AND Assignment x &= y
//            ScriptOperator.logical_or_assign -> {} //          ||=        Logical OR Assignment x ||= y
                right = parseExpr()
            }
        }
        return AssignStatement(writableValue, op, right)
    }

    private fun parseTry(): Statement {
        TODO()
    }

    private fun parseFor(): Statement {
        nextToken();
        expectOperator(Operator.open_parenthesis);
        val initialization: Statement = parseSingleLine();
        // expectOperator(ScriptOperator.semi_colon);
        val condition: Expr = parseExpr();
        expectOperator(Operator.semi_colon);
        val afterthought: Statement = parseSingleLine();
        expectOperator(Operator.close_parenthesis);
        val contentBlock: Statement = parseSingleLineOrBlock();
        return Statement.ForStatement(initialization, condition, afterthought, contentBlock)
    }

    private fun parseArgsList(): List<String> {
        val result = mutableListOf<String>()
        expectOperator(Operator.open_parenthesis);
        var curToken = this.curToken
        while (curToken !is ScriptToken.Eof) {
            when (curToken) {
                is ScriptToken.Identifier -> {
                    result.add(curToken.identifier)
                    nextToken()
                    if (this.curToken.operator == Operator.comma) nextToken()
                }

                else -> {
                    if (this.curToken.operator == Operator.close_parenthesis) {
                        nextToken()
                        return result
                    } else break;
                }
            }
            curToken = this.curToken
        }
        throw UnexpectedToken(curToken, " in function arguments list.")
    }

    private fun parseFunction(): Statement {
        nextToken();
        val functionName = expectIdentifier(" in function declaration");
        val args = parseArgsList();
        val body: Statement = parseSingleLineOrBlock()
        return Statement.FunctionDeclaration(null, functionName, args, body)
    }

    private fun parseReturn(): Statement {
        nextToken();
        val result = parseExpr()
        return ReturnStatement1(result);
    }


    private fun parseIf(): Statement {
        nextToken();
        expectOperator(Operator.open_parenthesis)
        val ifCondition = parseExpr()
        expectOperator(Operator.close_parenthesis)
        val thenBlock = parseSingleLineOrBlock()
        var elseBlock: Statement? = null
        val curToken = this.curToken
        if (curToken is ScriptToken.Identifier && curToken.identifier == "else") {
            nextToken();
            elseBlock = parseSingleLineOrBlock()
        }
        return Statement.IfStatement(ifCondition, thenBlock, elseBlock)
    }

    private fun expectOperator(op: Operator) {
        if (curToken.operator == op) {
            nextToken()
        } else {
            throw UnexpectedToken(curToken, " but was expecting " + op)
        }
    }

    private fun expectIdentifier(where: String): String {
        val curToken = this.curToken
        if (curToken is ScriptToken.Identifier) {
            nextToken()
            return curToken.identifier
        } else {
            throw UnexpectedToken(curToken, where)
        }
    }

    private fun parseWhile(): Statement {
        nextToken();
        expectOperator(Operator.open_parenthesis)
        val whileCondition = parseExpr()
        expectOperator(Operator.close_parenthesis)
        val loopBlock = parseSingleLineOrBlock()
        return Statement.WhileStatement(whileCondition, loopBlock)

    }

    private fun parseClass(): Statement {
        nextToken();
        val className = expectIdentifier(" class name expected after the class keyword")
        var baseClass: Expr? = null
        if (curToken.identifier == "extends") {
            nextToken()
            baseClass = parseExpr()
        }
        expectOperator(Operator.open_curly_brackets)
        var curToken = this.curToken
        val classStatement = Statement.ClassStatement(className, baseClass)
        while (curToken !is ScriptToken.Eof) {
            when (curToken) {
                is ScriptToken.Identifier -> {
                    val functionName = curToken.identifier
                    curToken = nextToken()
                    var args: List<String>? = null
                    if (curToken.operator == Operator.open_parenthesis) {
                        args = parseArgsList();
                    }
                    val body: Statement = parseSingleLineOrBlock()
                    classStatement.content.add(
                        Statement.FunctionDeclaration(
                            classStatement,
                            functionName,
                            args ?: emptyList(),
                            body
                        )
                    )
                    curToken = this.curToken
                    continue;
                }

                is ScriptToken.OpToken -> {
                    if (curToken.operator == Operator.close_curly_brackets) break
                }

                else -> {}
            }
            throw UnexpectedToken(curToken, " in class " + className)
        }
        expectOperator(Operator.close_curly_brackets)
        return classStatement

    }

    private fun parseSwitch(): Statement {
        TODO()
    }

    private fun parseDeclaration(type: DeclarationType): Statement {
        var curToken = this.curToken
        if (curToken is ScriptToken.Identifier) {
            val variableName = curToken.identifier
            var initialValue: Expr? = null
            curToken = nextToken()
            if (this.curToken.operator == Operator.simple_assign) {
                nextToken() // skip operator =
                initialValue = parseExpr()
            }
            return Statement.VariableDeclaration(type, variableName, initialValue)
        } else {
            throw UnexpectedToken(curToken, " in a variable declaration we expect a variable name.")
        }
    }

    private fun parseSingleLineOrBlock(): Statement {
        if (curToken.operator == Operator.open_curly_brackets) {
            nextToken()
            val block = parseBlock(false)
            if (curToken.operator == Operator.close_curly_brackets) {
                nextToken()
            }
            return block
        } else {
            return parseSingleLine()
        }
    }

    private fun parseExpr(fromToken: ScriptToken? = null): Expr {
        // we're switching here
        if (fromToken != null) {
            fileReader.rewind(fromToken.pos)
            context.exprParser.nextToken()
        }
        val result = context.exprParser.parseExpr(Operator.semi_colon.priority)
        // and back
        // nextToken()
        return result
    }
}



