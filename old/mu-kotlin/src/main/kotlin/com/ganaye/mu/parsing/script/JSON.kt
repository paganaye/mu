package com.ganaye.mu.parsing.script

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

object JSON {
    val JsonBuilder1 = Json { allowSpecialFloatingPointValues = true; }
    val JsonBuilder2 = Json(from = Json.Default, builderAction = {
        allowSpecialFloatingPointValues = true;
    })

    fun stringify(dbl: Double): String {
        return JsonBuilder1.encodeToString(dbl)
    }

    fun stringify(str: String): String {
        return JsonBuilder1.encodeToString(str)
    }

    fun stringify(bool: Boolean): String {
        return JsonBuilder1.encodeToString(bool)
    }

    fun stringify(any: Any?): String {
        return when (any) {
            is Boolean -> stringify(any)
            is String -> stringify(any)
            is Double -> stringify(any)
            null -> "null"
            else -> "[" + any.javaClass.name + "]"
        }
    }

    init {
        JsonBuilder1.configuration.prettyPrint
    }
}