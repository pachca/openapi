package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Address(
    val city: String,
    val zip: String? = null,
)

@Serializable
data class Person(
    val id: Int,
    val name: String,
    @SerialName("home_address") val homeAddress: Address? = null,
    @SerialName("work_address") val workAddress: Address? = null,
)
