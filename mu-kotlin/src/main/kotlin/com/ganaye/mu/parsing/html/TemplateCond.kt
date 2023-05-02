package com.ganaye.mu.parsing.html

import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.script.Expr

sealed class TemplateCond() {

    open fun toJS(jsBuilder: JSBuilder) {
        TODO()
    }

    class IfCond(val ifCond: Expr, val eltId: Int) : TemplateCond() {
        override fun toJS(jsBuilder: JSBuilder) {
            jsBuilder.append("mu.mountIf(")
            jsBuilder.indent()
            ifCond.toJS(output = jsBuilder, true)
            jsBuilder.append(",")
            jsBuilder.breakLongLine()
            jsBuilder.appendLine("renderElt${eltId},muElt${eltId})")
            jsBuilder.unindent()
        }
    }

    class Else : TemplateCond() {}
    class ElseIfCond(elseIfCont: Expr) : TemplateCond() {}

}