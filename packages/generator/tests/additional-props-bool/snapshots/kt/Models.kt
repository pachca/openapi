package com.pachca.sdk

import kotlinx.serialization.Serializable

@Serializable
class Metadata

@Serializable
data class Event(
    val id: Int,
    val type: String,
    val metadata: Map<String, Any>? = null,
)
