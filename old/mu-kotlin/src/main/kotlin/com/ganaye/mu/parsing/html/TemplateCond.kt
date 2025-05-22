package com.ganaye.mu.parsing.html

import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.script.Expr

sealed abstract class TemplateCond() {

    abstract fun toJS(jsBuilder: JSBuilder)

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

    class Else : TemplateCond() {
        override fun toJS(jsBuilder: JSBuilder) {
            //TODO("Not yet implemented")
        }
    }
    class ElseIfCond(elseIfCont: Expr) : TemplateCond() {
        override fun toJS(jsBuilder: JSBuilder) {
            //TODO("Not yet implemented")
        }
    }

}