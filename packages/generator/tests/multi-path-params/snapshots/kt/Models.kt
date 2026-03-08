package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Task(
    val id: Int,
    val title: String,
    @SerialName("is_done") val isDone: Boolean? = null,
)

@Serializable
data class TaskUpdateRequestTask(
    val title: String? = null,
    @SerialName("is_done") val isDone: Boolean? = null,
)

@Serializable
data class TaskUpdateRequest(
    val task: TaskUpdateRequestTask,
)

@Serializable
data class TaskDataWrapper(val data: Task)
