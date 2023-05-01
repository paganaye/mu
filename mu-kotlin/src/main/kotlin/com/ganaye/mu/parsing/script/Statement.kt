package com.ganaye.mu.parsing.script

import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.IToken

sealed class Statement {
    abstract fun toJS(output: JSBuilder, reactive: Boolean)

    class FunctionDeclaration(
        val parentClass: ClassStatement?,
        val name: String,
        val args: List<String>,
        val body: Statement
    ) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            val args = this.args.joinToString(",")
            if (parentClass != null)
                output.appendLine("$name($args) {")
            else
                output.appendLine("function $name($args) {")
            output.indent()
            body.toJS(output, reactive);
            output.unindent()
            output.appendLine("}")
        }

    }

    class VariableDeclaration
    constructor(val type: DeclarationType, val variableName: String, val initialValue: Expr? = null) :
        Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            val prefix = if (this.type == DeclarationType.NoDeclaration) "" else type.keyword
            if (initialValue == null) {
                output.append("$prefix $variableName")
            } else {
                output.append("$prefix $variableName=");
                if (initialValue.isVar) {
                    output.append("new Var(")
                    initialValue.toJS(output, reactive);
                    output.append(")")
                } else {
                    initialValue.toJS(output, reactive);
                }
            }
            output.append(";")
        }
    }

    class AssignStatement(
        val leftValue: Expr,
        val operator: Operator,
        right: Expr?
    ) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            TODO("Not yet implemented")
        }
    }

    class SwitchStatement : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            TODO("Not yet implemented")
        }
    }

    class TryStatement : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            TODO("Not yet implemented")
        }
    }

    class ReturnStatement(val result: Expr) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            output.append("return ");
            result.toJS(output, reactive);
        }
    }

    class IfStatement(val ifCondition: Expr, val thenBlock: Statement, val elseBlock: Statement?) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            output.append("if (")
            ifCondition.toJS(output, reactive)
            output.append(") ")
            thenBlock.toJS(output, reactive)
            if (elseBlock != null) {
                if (thenBlock !is ScriptBlock) output.append(";")
                output.append(" else ")
                elseBlock.toJS(output, reactive)
            }
        }
    }

    class ForStatement(
        val initialization: Statement,
        val condition: Expr,
        val afterthought: Statement,
        val contentBlock: Statement
    ) :
        Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            output.append("for (")
            initialization.toJS(output, reactive)
            output.append("; ")
            condition.toJS(output, reactive)
            output.append("; ")
            afterthought.toJS(output, reactive)
            output.append(") ")
            contentBlock.toJS(output, reactive)
        }
    }

    class ClassStatement(val className: String, val parentClass: Expr?) : Statement() {
        val content = mutableListOf<Statement>()
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            output.append("class ${className}")
            if (parentClass != null) {
                output.append(" extends ")
                parentClass.toJS(output, reactive);
            }
            output.appendLine(" {")
            output.indent()
            content.forEach({
                it.toJS(output, reactive)
            })
            output.unindent()
            output.appendLine("}")
        }
    }

    class ImportStatement : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            TODO("Not yet implemented")
        }
    }

    class EnumStatement : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            TODO("Not yet implemented")
        }
    }

    class WhileStatement(val condition: Expr, val loopBlock: Statement) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            output.append("while (")
            condition.toJS(output, reactive)
            output.append(") ")
            loopBlock.toJS(output, reactive)
        }
    }

    class FunctionCall : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            TODO("Not yet implemented")
        }
    }

    class ScriptBlock(content: Iterable<Statement>, val isRoot: Boolean = false) : Statement() {
        val lines = content.toList()
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            when (lines.size) {
                0 -> {
                    if (!isRoot) output.append("{}")
                }

                1 -> {
                    lines[0].toJS(output, reactive)
                    if (!isRoot) output.append(";")
                }

                else -> {
                    if (!isRoot) output.append("{")
                    var first = true
                    lines.forEach { line ->
                        line.toJS(output, reactive)
                    }
                    if (!isRoot) output.append("}")
                }
            }

        }
    }

    class InvalidScript
    constructor(val message: String, val token: IToken) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            output.append(this.toString())
        }

        override fun toString(): String {
            return "** ERROR : $message $token at ${token.pos}"
        }
    }

    class VoidExprLine(val expr: Expr) : Statement() {
        override fun toJS(output: JSBuilder, reactive: Boolean) {
            expr.toJS(output, reactive)
        }
    }

}

