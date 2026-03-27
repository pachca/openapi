from __future__ import annotations

from dataclasses import dataclass

import httpx

from .models import Task, TaskUpdateRequest
from .utils import deserialize, serialize, RetryTransport

class TasksService:
    async def get_task(
        self,
        project_id: int,
        task_id: int,
    ) -> Task:
        raise NotImplementedError("Tasks.getTask is not implemented")

    async def update_task(
        self,
        project_id: int,
        task_id: int,
        request: TaskUpdateRequest,
    ) -> Task:
        raise NotImplementedError("Tasks.updateTask is not implemented")

    async def delete_comment(
        self,
        project_id: int,
        task_id: int,
        comment_id: int,
    ) -> None:
        raise NotImplementedError("Tasks.deleteComment is not implemented")


class TasksServiceImpl(TasksService):
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_task(
        self,
        project_id: int,
        task_id: int,
    ) -> Task:
        response = await self._client.get(
            f"/projects/{project_id}/tasks/{task_id}",
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Task, body["data"])
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def update_task(
        self,
        project_id: int,
        task_id: int,
        request: TaskUpdateRequest,
    ) -> Task:
        response = await self._client.put(
            f"/projects/{project_id}/tasks/{task_id}",
            json=serialize(request),
        )
        body = response.json()
        match response.status_code:
            case 200:
                return deserialize(Task, body["data"])
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )

    async def delete_comment(
        self,
        project_id: int,
        task_id: int,
        comment_id: int,
    ) -> None:
        response = await self._client.delete(
            f"/projects/{project_id}/tasks/{task_id}/comments/{comment_id}",
        )
        match response.status_code:
            case 204:
                return
            case _:
                raise RuntimeError(
                    f"Unexpected status code: {response.status_code}"
                )


@dataclass
class PachcaServices:
    tasks: TasksService | None = None


class PachcaClient:
    def __init__(self, token: str, base_url: str = "https://api.example.com/v1", services: PachcaServices | None = None) -> None:
        services = services or PachcaServices()
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.tasks: TasksService = services.tasks or TasksServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()
