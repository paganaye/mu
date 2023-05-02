package com.ganaye.mu.parsing.html

import com.ganaye.mu.emit.HTMLBuilder
import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.script.Expr
import com.ganaye.mu.parsing.script.JSON
import com.ganaye.mu.parsing.script.Statement
import io.ktor.util.*

class HTMLAndScriptBuilder {
    val htmlBuilder = HTMLBuilder()
    val jsBuilder = JSBuilder()

    public override fun toString(): String {
        return toHTML()
    }

    fun toHTML(): String {
        val html = htmlBuilder.toString();
        val js = jsBuilder.toString().trim();
        return if (js.isNotEmpty()) {
            val textToInsert = "\n<script>\n$js\n</script>\n"
            val indexOfHtmlEnd = html.lastIndexOf("</html>")
            if (indexOfHtmlEnd < 0) (html + textToInsert)
            else (html.substring(0, indexOfHtmlEnd) + textToInsert + html.substring(indexOfHtmlEnd))
        } else html
    }
}

sealed class HtmlNode {
    open val id: Int
        get() = 0

    protected fun renderPlaceHolder(output: HTMLAndScriptBuilder, tagName: String = "span") {
        output.htmlBuilder.startTag(tagName)
        output.htmlBuilder.append(""" id="muElt${id}"""")
        output.htmlBuilder.enterTag()
        output.htmlBuilder.append("…")
        output.htmlBuilder.closeTag(tagName)
    }

    override fun toString(): String {
        val b = HTMLAndScriptBuilder()
        toHtml(b)
        return b.toString()
    }

    abstract fun toHtml(output: HTMLAndScriptBuilder)
    abstract fun toJS(output: JSBuilder, reactive: Boolean)

    companion object {
        var NodeIdCounter = 0
    }
}

class HTMLFragment(children: Iterable<HtmlNode>) : HtmlNode() {
    val children = children.toList()
    override fun toHtml(output: HTMLAndScriptBuilder) {
        children.forEach {
            it.toHtml(output)
        }
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        children.forEach {
            it.toJS(output, reactive)
        }
    }

}

open class HTMLElement
constructor(val tagName: String, attributes: Iterable<MuAttribute>, children: Iterable<HtmlNode>?) : HtmlNode() {
    val children = children?.toList()
    val attributes: List<HTMLAttribute>
    val lTagName: String;
    val tagType: TagType
    val loop: TemplateLoop?
    val cond: TemplateCond?

    private var _id = 0
    override val id: Int
        get() {
            if (_id == 0) _id = (++NodeIdCounter)
            return _id
        }

    enum class TagType {
        DocTypeDeclaration, AlwaysSelfClose, NeverSelfClose, Normal
    }

    init {
        lTagName = tagName.toLowerCasePreservingASCIIRules()
        tagType = if (selfClosingTags.contains(lTagName)) TagType.AlwaysSelfClose
        else if (lTagName.startsWith('!')) TagType.DocTypeDeclaration
        else if (lTagName == "script" || lTagName == "title") TagType.NeverSelfClose
        else TagType.Normal

        var loop: TemplateLoop? = null
        var cond: TemplateCond? = null
        var hasIf = false
        var hasElse = false
        var hasElseIf = false
        val htmlAttributes = mutableListOf<HTMLAttribute>()
        attributes.forEach {
            when (it.name) {
                "if" -> cond = TemplateCond.IfCond(it.value!!, this.id)
                "elseif", "else-if" -> cond = TemplateCond.ElseIfCond(it.value!!)
                "else" -> cond = TemplateCond.Else()
                "foreach" -> loop = TemplateLoop.ForEachLoop(varName = "it", iterator = Expr.Null)
                "while" -> loop = TemplateLoop.WhileLoop(whileCond = Expr.Null)
                else -> htmlAttributes.add(HTMLAttribute(this, it.name, it.value))
            }
        }
        this.loop = loop
        this.cond = cond

        this.attributes = htmlAttributes.toList()
    }

    override fun toHtml(output: HTMLAndScriptBuilder) {
        var condValue = true
        if (cond != null) {
            condValue = false
            cond.toJS(output.jsBuilder)
        }
        if (condValue) {
            var loopIndex = 0
            while (true) {
                val loopValue = loop?.eval(loopIndex) ?: (loopIndex == 0)
                if (!loopValue) {
                    if (loopIndex == 0) {
                        renderPlaceHolder(output)
                    }
                    break
                }
                output.htmlBuilder.startTag(tagName)
                attributes.forEach {
                    output.htmlBuilder.append(" ")
                    it.toHtml(output)
                }
                val withClosingTag: Boolean
                val selfClosing: Boolean
                when (tagType) {
                    TagType.DocTypeDeclaration -> {
                        selfClosing = false
                        withClosingTag = false
                    }

                    else -> {
                        if (tagType == TagType.NeverSelfClose || (children != null && children.isNotEmpty())) {
                            selfClosing = false
                            withClosingTag = true
                        } else {
                            selfClosing = true
                            withClosingTag = false
                        }
                    }
                }
                if (selfClosing) {
                    output.htmlBuilder.selfClose(tagType == TagType.DocTypeDeclaration)
                } else {
                    output.htmlBuilder.enterTag()
                }
                children?.forEach { it.toHtml(output) }
                if (withClosingTag) {
                    output.htmlBuilder.closeTag(tagName)
                }
                loopIndex += 1
            }
        } else {
            renderPlaceHolder(output)
        }
        if (this.cond != null || this.loop != null) {
            output.jsBuilder.appendLine("function renderElt${this.id}(it) {")
            output.jsBuilder.indent()
            output.jsBuilder.append("return ")
            this.toJS(output.jsBuilder, true)
            output.jsBuilder.appendLine(";")
            output.jsBuilder.unindent()
            output.jsBuilder.appendLine("}")
        }
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        //if (reactive) {
        output.append("mu.elt(\"$tagName\"")
        if (attributes.size > 0) {
            attributes.forEach {
                var first = true
                output.append(",{")
                children?.forEach {
                    if (first) first = false
                    else output.append(",")
                    it.toJS(output, reactive)
                }
                output.append("}")
            }
        } else output.append(",null")
        if (children != null && children.size > 0) {
            children.forEach {
                output.append(",")
                it.toJS(output, reactive)
            }
        }
        output.append(")")
        //} else TODO() // toHtml(output)
    }

    companion object {
        val selfClosingTags = setOf(
            "area",
            "base",
            "br",
            "col",
            "embed",
            "hr",
            "img",
            "input",
            "link",
            "meta",
            "param",
            "source",
            "track",
            "wbr"
        )
    }

}

class HTMLScriptElement
constructor(attributes: Iterable<MuAttribute>, val content: Statement.ScriptBlock) :
    HTMLElement("script", attributes, null) {

    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.startTag("script")
        if (attributes.size > 0) {
            output.htmlBuilder.append(" ")
            attributes.forEach {
                output.htmlBuilder.append(" ")
                it.toHtml(output)
            }
        }
        if (content.lines.size > 0) {
            output.htmlBuilder.enterTag()
            val jsBuilder = JSBuilder()
            content.toJS(jsBuilder, true);
            output.htmlBuilder.appendRaw("\n" + jsBuilder.toString())
        } else {
            output.htmlBuilder.enterTag()
        }
        output.htmlBuilder.closeTag("script")

    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        TODO()
    }
}

class MuAttribute(val name: String, val value: Expr?) {

}

class HTMLAttribute
constructor(val parent: HTMLElement, val attributeName: String, val attributeValue: Expr?) : HtmlNode() {
    override val id: Int
        get() {
            return parent.id
        }

    override fun toHtml(output: HTMLAndScriptBuilder) {

        output.htmlBuilder.append(attributeName)
        if (attributeValue != null) {
            output.htmlBuilder.append("=")
            if (attributeValue.isConst) {
                output.htmlBuilder.append(JSON.stringify(attributeValue.constValue))
            } else {
                output.htmlBuilder.append("\"")
                val jsBuilder = JSBuilder()
                attributeValue.toJS(jsBuilder, true);
                output.htmlBuilder.append(jsBuilder.asSingleString())
                output.htmlBuilder.append("\"")
            }
        }
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        if (attributeValue == null) output.append(attributeName)
        else {
            output.append("$attributeName : ")
            attributeValue.toJS(output, reactive)
        }
    }
}

class HTMLExpr(val content: Expr) : HtmlNode() {
    private var _id = 0
    override val id: Int
        get() {
            if (_id == 0) _id = (++NodeIdCounter)
            return _id
        }

    override fun toHtml(output: HTMLAndScriptBuilder) {
        renderPlaceHolder(output)
        output.jsBuilder.append("mu.mount(")
        content.toJS(output.jsBuilder, true);
        output.jsBuilder.appendLine(",muElt${id});")
    }


    override fun toJS(output: JSBuilder, reactive: Boolean) {
        output.append("[TODO script...]")
    }
}

class HTMLText(val content: String) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.append(content)
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        output.append(JSON.stringify(content));
    }

}

class InvalidHTML(val message: String, val token: HTMLToken) : HtmlNode() {
    override fun toHtml(output: HTMLAndScriptBuilder) {
        output.htmlBuilder.append("Invalid: " + message + " " + token)
    }

    override fun toJS(output: JSBuilder, reactive: Boolean) {
        output.append("Invalid: " + JSON.stringify(message) + " " + token);
    }

}

