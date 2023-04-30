package com.ganaye.mu

import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class HTMLParserTest {
    fun testHTML(source: String, expected: String) {
        val context = Context(SourceFile("/test", source))
        val ast = context.htmlParser.parseAll()
        val output = StringBuilder()
        ast.toHtml(output)
        val actual = output.toString()
        assertEquals(expected, actual)
    }

    fun testJS(source: String, expected: String) {
        val context = Context(SourceFile("/test", source))
        val ast = context.htmlParser.parseAll()
        val output = StringBuilder()
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
    fun parseSimpleExpr() {
        val source = """<p>Hello {userName}</p>""".trimIndent()
        val expected = """mu.elt("p",null,"Hello {userName}")""".trimIndent()
        testJS(source, expected)
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
        val expected = """<button click=handleClick/>""".trimIndent()
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
<button click={handleClick}>
    Clicked {count} {count === 1 ? 'time' : 'times'}
</button>
<script lang="mu">
muUser = "Pascal";
console.log("MU says hello Pascal");
let count = 0;
// it appears similar to svelte reactivity.
function handleClick() {
    count += 1;
}

</script>
<h1>HTML says hello Pascal</h1>
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
<button click=handleClick>
    Clicked {count} {count === 1 ? 'time' : 'times'}
</button>
<script lang="mu">
muUser = "Pascal";
console.log("MU says hello Pascal");
let count = 0;
// it appears similar to svelte reactivity.
function handleClick() {
    count += 1;
}

</script>
<h1>HTML says hello Pascal</h1>
</body>
</html>""".trimIndent()
        testHTML(source, expected)
    }

}