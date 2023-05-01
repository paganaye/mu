package com.ganaye.mu.emit

class JSBuilder : BuilderWithIndent(2) {

    fun append(s: String) {
        if (s.indexOf("\n") >= 0) {
            throw InternalError("JSBuilder.append does not allow multiple lines.")
        }
        appendString(s)
    }

    fun appendLine(s: String) {
        appendString(s)
        appendString("\n")
        flush();
    }
}

