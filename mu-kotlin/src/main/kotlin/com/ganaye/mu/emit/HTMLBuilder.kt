package com.ganaye.mu.emit

class HTMLBuilder : BuilderWithIndent(4) {
    var elts = mutableListOf<String>()
    var startedTag: String? = null

    fun append(s: String) {
        if (s.indexOf("<") >= 0 || s.indexOf(">") >= 0) {
            throw InternalError("HTMLBuilder.append does not allow angular brackets.")
        }
        appendString(s)
    }

    fun startTag(tagName: String) {
        if (startedTag != null) throw InternalError("Cannot start a element <$tagName> while starting <$startedTag>")
        appendString("<$tagName")
        startedTag = tagName
    }

    fun closeTag(tagName: String) {
        if (startedTag != null) throw InternalError("Cannot close $tagName while starting $startedTag")
        val last = elts.lastOrNull() ?: "null"
        if (last == tagName) elts.removeLast()
        else throw InternalError("Cannot close $tagName while the last entered elt is $last")
        appendString("</$tagName>")
    }

    fun enterTag() {
        if (startedTag == null) throw InternalError("Cannot enter tag if none started.")
        appendString(">")
        elts.add(startedTag!!)
        startedTag = null;
    }

    fun selfClose(docTypeDeclaration: Boolean) {
        if (startedTag == null) throw InternalError("Cannot self close tag if none started.")
        appendString(if (docTypeDeclaration) ">" else "/>")
        startedTag = null;
    }

    fun appendRaw(s: String) {
        appendString(s)
    }

}
