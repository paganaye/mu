package com.ganaye.mu

import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import com.ganaye.mu.parsing.html.HTMLAndScriptBuilder
import com.ganaye.mu.parsing.html.HTMLExpr.Companion.idCounter
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class HTMLParserTest {
    fun testHTML(source: String, expected: String) {
        idCounter = 0
        val context = Context(SourceFile("/test", source))
        val ast = context.htmlParser.parseAll()
        val output = HTMLAndScriptBuilder()
        ast.toHtml(output)
        val actual = output.toString()
        assertEquals(expected, actual)
    }

    fun testJS(source: String, expected: String) {
        val context = Context(SourceFile("/test", source))
        val ast = context.htmlParser.parseAll()
        val output = JSBuilder()
        ast.toJS(output, true)
        val actual = output.toString()
        assertEquals(expected, actual)
    }

    @Test
    fun parseSimpleHTML() {
        val source = "<h1>Hello world</h1>"
        val expected = "<h1>Hello world</h1>"
        testHTML(source, expected)
    }

    @Test
    fun parseSimpleElement() {
        val source = "<p>Hello</p>"
        val expected = """mu.elt("p",null,"Hello")"""
        testJS(source, expected)
    }

    @Test
    fun parseSimpleExpr() {
        val source = "Hello {userName}"
        val expected = """Hello <span id="muElt1">…</span>
<script>
mu.mount(muElt1,userName);
</script>
"""
        testHTML(source, expected)
    }

    @Test
    fun selfClosingTag() {
        val source = """<img>hi""".trimIndent()
        val expected = """<img/>hi""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun parseHTMLLink() {
        val source = """<a href="ganaye.com">My site</h1>""".trimIndent()
        val expected = """<a href="ganaye.com">My site</a>""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun parseMoreComplexExpression() {
        val source = """<a href=("ganaye" + ".com")>My site</h1>""".trimIndent()
        val expected = """<a href="ganaye.com">My site</a>""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun parseButtonClick() {
        val source = """<button click={handleClick}>""".trimIndent()
        val expected = """<button click="handleClick"/>""".trimIndent()
        testHTML(source, expected)
    }

    @Test
    fun longerHTML_but_wrong() {
        val source = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Untitled Document</title>
</head>
<body>
<script src="mu.js"></script>
<h1>HTML says hello {muUser}</h1>
<button onclick={count=count+1}>
    Clicked {count} {count == 1 ? 'time' : 'times'}
</button>
<script lang="mu">
let muUser = "Pascal";
let count = 0;
</script>
</body>
</html>""".trimIndent()

        val expected = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Untitled Document</title>
</head>
<body>
<script  src="mu.js"></script>
<h1>HTML says hello <span id="muElt1">…</span></h1>
<button onclick="mu.assign(count,mu.plus(count,1.0))">
    Clicked <span id="muElt2">…</span> <span id="muElt3">…</span>
</button>
<script  lang="mu">
let muUser=new Var("Pascal");
let count=new Var(0.0);
</script>
</body>

<script>
mu.mount(muElt1,muUser);
mu.mount(muElt2,count);
mu.mount(muElt3,mu.ternary_cond(mu.equalequal(count,1.0),"time","times"));
</script>
</html>""".trimIndent()
        testHTML(source, expected)
    }


    @Test
    fun small_HTML() {
        val source = """
<script src="mu.js"></script>
<h1>Hello {user}</h1>
<script>
user = "Pascal"
</script>""".trimIndent()

        val expectedHTML = """
<script  src="mu.js"></script>
<h1>Hello <span id="muElt1">…</span></h1>
<script>
mu.assign(user,"Pascal");
</script>
<script>
mu.mount(muElt1,user);
</script>

""".trimIndent()
        testHTML(source, expectedHTML)
    }

    @Test
    fun smaller_HTML() {
        val source = "Hello {user}"
        val expectedHTML = """Hello <span id="muElt1">…</span>
<script>
mu.mount(muElt1,user);
</script>

""".trimIndent()
        testHTML(source, expectedHTML)
    }

    @Test
    fun openScriptTag() {
        val src = "<script src=\"A\"></script>"
        val exp = "<script  src=\"A\"></script>"
        testHTML(src, exp)
    }

    @Test
    fun emptyScriptTag() {
        val src = "<script src=\"A\"/>"
        val exp = "<script src=\"A\"></script>"
        testHTML(src, exp)
    }

    @Test
    fun buttonOnClick() {
        val src = "<button onclick={count=count+1}>"
        val exp = "<button onclick=\"mu.assign(count,mu.plus(count,1.0))\"/>"
        testHTML(src, exp)
    }

    @Test
    fun script_tag() {
        val source = "<script>let a=1</script>"
        val expectedHTML = """
<script>
let a=new Var(1.0);
</script>
""".trimIndent()
        testHTML(source, expectedHTML)
    }
}