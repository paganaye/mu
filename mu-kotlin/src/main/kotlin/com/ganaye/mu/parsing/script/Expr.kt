package com.ganaye.mu.parsing.script

import com.ganaye.mu.parsing.IToken
import com.ganaye.mu.parsing.html.HtmlNode

sealed class Expr {
    abstract fun toJS(output: StringBuilder, reactive: Boolean)
    open val priority: Int = Operator.priorityMax
    abstract val isConst: Boolean
    abstract val constValue: Any?
    open val isWritable: Boolean? = null
    var isVar: Boolean = true

    class NumberConst(val value: Double) : Expr() {
        override val isConst: Boolean = true
        override val constValue: Any = value

        override fun toString(): String {
            return value.toString()
        }

        override fun toJS(output: StringBuilder, reactive: Boolean) {
            output.append(JSON.stringify(value))
        }
    }

    class StringConst(val value: String) : Expr() {
        override val isConst: Boolean = true
        override val constValue: Any = value
        override fun toJS(output: StringBuilder, reactive: Boolean) {
            output.append('"' + value + '"')
        }
    }

    class JsxElement(val value: HtmlNode) : Expr() {
        override val isConst: Boolean = false
        override val constValue: Any? = null
        override fun toJS(output: StringBuilder, reactive: Boolean) {
            value.toJS(output, reactive);
        }
    }

    class Identifier(val identifier: String) : Expr() {
        override val isConst: Boolean = false
        override val constValue: Any? = null
        override fun toJS(output: StringBuilder, reactive: Boolean) {
            output.append(identifier)
        }
    }

    class InvalidExpr
    constructor(val message: String, val token: IToken) : Expr() {
        override val isConst: Boolean = false
        override val constValue: Any? = null
        override fun toJS(output: StringBuilder, reactive: Boolean) {
            output.append(this.toString())
        }

        override fun toString(): String {
            return "** ERROR : $message $token at ${token.pos}"
        }
    }

    class UnaryOp(val op: Operator, val expr: Expr) : Expr() {
        override val isConst: Boolean = expr.isConst
        override val constValue: Any? = { throw NotImplementedError() }
        override fun toJS(output: StringBuilder, reactive: Boolean) {
            val preFix = op.type == OperatorType.Prefix
            val postFix = op.type == OperatorType.Postfix
            if (preFix) output.append(op.chars)
            expr.toJS(output, reactive)
            if (postFix) output.append(op.chars)
        }

    }

    class BinaryOp
    constructor(val left: Expr, val op: Operator, val right: Expr) : Expr() {
        override val isConst: Boolean = left.isConst && right.isConst
        override val constValue: Any? by lazy {
            op.calcBinaryConst(left.constValue, right.constValue)
        }

        override fun toString(): String = op.toString()

        override fun toJS(output: StringBuilder, reactive: Boolean) {
            if (isConst) {
                output.append(JSON.stringify(constValue))
            } else {
                if (reactive) {
                    output.append("mu.${op.name}(")
                    left.toJS(output, true)
                    output.append(",")
                    right.toJS(output, true)
                    output.append(")")
                } else {
                    if (left.priority < this.priority) {
                        output.append("(")
                        left.toJS(output, false)
                        output.append(")")
                    } else {
                        left.toJS(output, false)
                    }
                    output.append(op.chars)
                    if (right.priority < this.priority) {
                        output.append("(")
                        right.toJS(output, false)
                        output.append(")")
                    } else {
                        right.toJS(output, false)
                    }
                }
            }
        }

        override val priority = op.priority


    }

    class TernaryCond
    constructor(val cond: Expr, val op: Operator, val trueValue: Expr, val falseValue: Expr) : Expr() {
        override val isConst: Boolean =
            cond.isConst && (if (isTruthy(cond.constValue)) trueValue.isConst else falseValue.isConst) //
        override val constValue: Any? by lazy {
            if (isTruthy(cond.constValue)) trueValue.constValue else falseValue.constValue
        }

        override fun toString(): String = cond.toString() + "?" + trueValue.toString() + ":" + constValue.toString()

        override fun toJS(output: StringBuilder, reactive: Boolean) {
            if (isConst) {
                output.append(JSON.stringify(constValue))
            } else {
                output.append("mu.${op.name}(")
                cond.toJS(output, reactive)
                output.append(",")
                trueValue.toJS(output, true)
                output.append(",")
                falseValue.toJS(output, true)
                output.append(")")
            }
        }

        override val priority = op.priority


    }

    class NaryOp
    constructor(val op: Operator, val args: List<Expr>) : Expr() {
        override val isConst: Boolean = args.all { it.isConst }
        override val constValue: Any? by lazy {
            op.calcNAryConst(args.map { it.constValue })
        }

        override fun toString(): String = op.toString()

        override fun toJS(output: StringBuilder, reactive: Boolean) {
            if (isConst) {
                output.append(JSON.stringify(constValue))
            } else {
                output.append("mu.${op.name}(")
                var first = true
                args.forEach {
                    if (first) first = false
                    else output.append(",")
                    it.toJS(output, reactive)
                }
                output.append(")")
            }
        }

        override val priority = op.priority
    }

    class LambdaOp(val args: List<String>, val expr: Expr) : Expr() {
        override val isConst: Boolean = true
        override val constValue: Any? = expr

        override fun toString(): String = "(${args.joinToString(",")}) => $expr"

        override fun toJS(output: StringBuilder, reactive: Boolean) {
            output.append("(${args.joinToString(",")}) => ")
            expr.toJS(output, reactive)
        }

        override val priority = Operator.lambda.priority
    }

    class FunctionCall
    constructor(val thisValue: Expr, val args: Iterable<Expr>) : Expr() {
        override val isConst: Boolean = thisValue.isConst && args.all { it.isConst }
        override val constValue: Any? by lazy { null }
        override fun toString(): String =
            thisValue.toString() + "(" + args.map { it.toString() }.joinToString(",") + ")"

        override fun toJS(output: StringBuilder, reactive: Boolean) {
            thisValue.toJS(output, reactive)
            output.append("(")
            var first = true
            args.forEach {
                if (first) first = false
                else output.append(",")
                it.toJS(output, reactive)
            }
            output.append(")")
        }

    }

}