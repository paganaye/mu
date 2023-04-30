package com.ganaye.mu.parsing.script

fun isTruthy(value: Any?): Boolean {
    return when (value) {
        null -> false
        is Boolean -> value
        is Number -> value != 0
        is String -> value.isNotEmpty()
        else -> true
    }
}