Be extrimely concise. Sacrifice grammar for the sake of concision.

### Avoid comments

- Do not add separate markdown files with explanations
- Explanatory comments that describe _what_ code does
- Comments that restate the code in natural language
- Commented-out code (delete it; version control preserves history)
- TODO comments without issue tracker references
- Redundant JSDoc that merely repeats type information

### Return Early

Reduce nesting by returning early for edge cases:

### Prefer Type Inference

```typescript
// Good
const userIds = users.map((user) => user.id); // string[] inferred
const isActive = checkStatus(); // boolean inferred

// Bad
const userIds: string[] = users.map((user: User) => user.id); // redundant
const isActive: boolean = checkStatus(); // obvious
```

### Discriminated Unions

Use discriminated unions for type-safe state handling:

```typescript
// Good
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function handleRequest<T>(state: RequestState<T>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <Display data={state.data} />;  // data is available here
    case 'error':
      return <ErrorMessage error={state.error} />;  // error is available here
  }
}
```

### Use exhaustive checks

Always use exhaustive checks even if there are only a few branches.

```typescript
const result = await setProfileId({ queryClient, profileId: profileState.id });
if (result.isErr()) {
  expectNever(result.error);
}
if (result.value.type === "ALREADY_CHANGING") return;
if (result.value.type === "SUCCESS") {
  return navigate({ to: "/chats" });
}
expectNever(result.value);
```

### Prefer composability

Return discriminated results for branching outcomes instead of accepting callback arguments. Caller composes post-actions. Callbacks are reserved for iteration, subscription, and render delegation patterns.

```typescript
// ❌ Bad callbacks
function validateForm(data, { onValid, onInvalid }) {
  if (isValid(data)) onValid();
  else onInvalid(errors);
}

// ✅ Return result
function validateForm(
  data,
): { type: "VALID" } | { type: "INVALID"; errors: string[] } {
  if (isValid(data)) return { type: "VALID" };
  return { type: "INVALID", errors };
}
```
