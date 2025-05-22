package com.ganaye.mu.parsing.html

import com.ganaye.mu.parsing.script.Expr

sealed class TemplateLoop {
    fun eval(loopIndex: Int): Boolean {
        return loopIndex < 10
    }

    class WhileLoop(val whileCond: Expr) : TemplateLoop() {}
    class ForEachLoop(val varName: String = "it", val iterator: Expr) : TemplateLoop() {}
}