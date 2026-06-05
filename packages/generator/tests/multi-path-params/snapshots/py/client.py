from __future__ import annotations

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


PACHCA_API_URL = "https://api.example.com/v1"


class PachcaClient:
    def __init__(self, token: str, base_url: str = PACHCA_API_URL, tasks: TasksService | None = None) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            transport=RetryTransport(httpx.AsyncHTTPTransport()),
        )
        self.tasks: TasksService = tasks or TasksServiceImpl(self._client)

    async def close(self) -> None:
        await self._client.aclose()

    @classmethod
    def from_client(
        cls,
        client: httpx.AsyncClient,
        tasks: TasksService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = client
        self.tasks: TasksService = tasks or TasksServiceImpl(client)
        return self

    @classmethod
    def stub(
        cls,
        tasks: TasksService | None = None,
    ) -> "PachcaClient":
        self = cls.__new__(cls)
        self._client = None
        self.tasks = tasks or TasksService()
        return self
