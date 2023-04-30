package com.ganaye.mu.runtime

import com.ganaye.mu.parsing.html.HtmlNode
import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.Statement

object Runtime {
    fun toHTML(ast: HtmlNode, output: StringBuilder) {
        ast.toHtml(output)
    }

    fun toJs(ast: Expr, output: StringBuilder, reactive: Boolean) {
        ast.toJS(output,reactive)
    }

    fun toJs(ast: Statement, output: StringBuilder, reactive: Boolean) {
         ast.toJS(output,reactive)
    }
}
