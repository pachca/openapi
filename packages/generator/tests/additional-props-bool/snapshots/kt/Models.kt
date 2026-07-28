package com.pachca.sdk

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
class Metadata

@Serializable
data class Event(
    val id: Int,
    val type: String,
    val metadata: Map<String, JsonElement>? = null,
)
