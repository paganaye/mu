package com.ganaye.mu.parsing.script

import com.ganaye.mu.parsing.BaseParser
import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.ParserException
import com.ganaye.mu.parsing.UnexpectedToken

class ExprParser
constructor(context: Context) : BaseParser<ScriptToken, Expr>(context, context.scriptTokenizer) {

    fun parseAttributeExpr(priority: Int): Expr {
        this.nextToken()
        val result = parseExpr(priority)
        return result
    }

    fun parseHTMLExpr(): Expr {
        tokenizer.clearToken()
        val result = parseExpr(Operator.close_curly_brackets.priority)
        return result
    }

    fun parseExpr(priority: Int = Operator.priorityZero): Expr {
        var result = parseLeft()
        var curToken = this.curToken
        while (curToken is ScriptToken.OpToken) {
            var operator = curToken.operator
            if (operator == Operator.open_parenthesis) {
                operator = Operator.function_call
            }
            if (curToken.operator.priority > priority) {
                when (operator.type) {
                    OperatorType.Func -> result = parseFunctionCall(result)
                    OperatorType.Postfix -> {
                        result = parseUnaryExpr(result, operator)
                    }

                    OperatorType.Binary -> {
                        result = parseBinaryExpr(result, operator)
                    }

                    OperatorType.N_Ary -> {
                        result = parseNAryExpr(result, operator)
                    }

                    OperatorType.Lambda -> {
                        result = parseLambdaExpr(result, operator)
                    }

                    OperatorType.Ternary -> {
                        result = parseTernaryCond(result, operator)
                    }

                    else -> break
                }
            } else break
            curToken = this.curToken
        }
        return result
    }

    private fun parseBinaryExpr(left: Expr, operator: Operator): Expr {
        nextToken()
        val right = parseExpr(operator.priority)
        return Expr.BinaryOp(left, operator, right)
    }

    private fun parseTernaryCond(cond: Expr, operator: Operator): Expr {
        nextToken()
        val trueExpr = parseExpr(priority = Operator.colon_assign.priority)
        if (curToken.operator === Operator.colon_assign) {
            nextToken()
        } else throw UnexpectedToken(curToken, " in ? : expression. Character is : is expected.")
        val falseExpr = parseExpr()
        return Expr.TernaryCond(cond, operator, trueExpr, falseExpr)
    }

    private fun parseLambdaExpr(left: Expr, operator: Operator): Expr {
        mutableListOf<String>()
        fun getIdentifier(expr: Expr): String {
            if (expr is Expr.Identifier) return expr.identifier
            else throw ParserException("$expr is not an identifier", curToken.pos)
        }

        val args = if (left is Expr.NaryOp && left.op == Operator.comma) {
            left.args.map { getIdentifier(it) }
        } else {
            listOf(getIdentifier(left))
        }
        nextToken()
        val expr = parseExpr()
        return Expr.LambdaOp(args, expr)
    }

    private fun parseNAryExpr(left: Expr, operator: Operator): Expr {
        val args = mutableListOf(left)
        while (curToken.operator == operator) {
            nextToken()
            args.add(parseExpr(operator.priority))
        }
        return Expr.NaryOp(operator, args)
    }

    private fun parseUnaryExpr(left: Expr, operator: Operator): Expr {
        nextToken()
        return Expr.UnaryOp(operator, left)
    }

    private fun parseFunctionCall(left: Expr): Expr {
        nextToken()
        val args = mutableListOf<Expr>()
        var curToken = this.curToken
        var first = true
        while (curToken !is ScriptToken.Eof) {
            if (curToken is ScriptToken.OpToken && curToken.operator == Operator.close_parenthesis) {
                nextToken()
                return Expr.FunctionCall(left, args)
            }
            if (first) {
                first = false
            } else if (curToken is ScriptToken.OpToken && curToken.operator == Operator.comma) {
                nextToken()
            } else {
                throw UnexpectedToken(curToken, "Expecting a comma or a closing parenthesis")
            }
            val nextArg = parseExpr(priority = Operator.comma.priority)
            args.add(nextArg)
            curToken = this.curToken
        }
        throw UnexpectedToken(curToken, "Expecting a comma or a closing parenthesis")
    }

    private fun parseLeft(): Expr {
        var curToken = this.curToken
        when (curToken) {

            is ScriptToken.Identifier -> {
                return clearTokenAndReturn(Expr.Identifier(curToken.identifier))
            }

            is ScriptToken.StringLiteral -> {
                return clearTokenAndReturn(Expr.StringConst(curToken.value))
            }

            is ScriptToken.OpToken -> {
                var op = curToken.operator
                when (op) {
                    Operator.postfix_inc -> op = Operator.prefix_inc;
                    Operator.postfix_dec -> op = Operator.prefix_dec;
                    Operator.plus -> op = Operator.unary_plus;
                    Operator.sub -> op = Operator.unary_minus;
                    else -> {}
                }

                when (op) {
                    Operator.unary_plus, Operator.unary_minus -> return clearTokenAndReturn(
                        Expr.UnaryOp(curToken.operator, parseLeft())
                    )

                    Operator.lt -> {
                        // we're switching parser here
                        this.fileReader.rewind(curToken.pos)
                        val elt = context.htmlParser.parseOne()
                        // and back
                        tokenizer.clearToken()
                        return Expr.JsxElement(elt)
                    }

                    Operator.open_parenthesis -> {
                        this.nextToken()
                        val result = parseExpr(priority = Operator.priorityZero)
                        curToken = this.curToken
                        if (curToken is ScriptToken.OpToken && curToken.operator == Operator.close_parenthesis) {
                            nextToken()
                        } else {
                            throw UnexpectedToken(curToken, "Expecting a closing parenthesis")
                        }
                        return result
                    }

                    Operator.square_bracket -> {
                        return parseJSONArray()
                    }

                    Operator.open_curly_brackets -> {
                        return parseJSONObject()
                    }

                    else -> throw UnexpectedToken(curToken, " at the start of the expression")

                }
            }

            is ScriptToken.Number -> {
                return clearTokenAndReturn(Expr.NumberConst(curToken.value))
            }

//            is ScriptToken.InvalidToken -> {
//                return throw UnexpectedToken(curToken,)
//            }

            is ScriptToken.Eof -> {
                throw UnexpectedToken(curToken, "EOF not expected. Expecting a comma or a closing parenthesis")
            }
        }
        throw NotImplementedError()
    }

    fun parseJSONArray(): Expr {
        nextToken() // skip [
        val entries = mutableListOf<Expr>()
        while (curToken !is ScriptToken.Eof) {
            entries.add(parseExpr(Operator.square_bracket.priority))
            if (curToken.operator == Operator.close_square_bracket) {
                nextToken()
                return Expr.Array(entries)
            }
            if (curToken.operator == Operator.comma) {
                nextToken()
            } else throw UnexpectedToken(curToken, " in Array. Expecting a comma or closing the array with ].")
        }
        throw UnexpectedToken(curToken, " in Array.")
    }

    fun parseJSONObject(): Expr {
        TODO()
    }
}