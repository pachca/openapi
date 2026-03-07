### Handle form submission (view_submission)

1. Receive webhook with `"type": "view"`, `"event": "submit"` — contains `callback_id`, `user_id`, `private_metadata` and `data`
   > Field values: keys match `name` of each block

2. Extract values from `data`

3. If `file_input` exists — download files via `data.field_name[].url` immediately
   > Links expire in 1 hour

4. If data is valid → respond HTTP 200 (empty body) — form will close

5. If errors exist → respond HTTP 400 with `{"errors": {"field_name": "error text"}}`
   > User will see errors in form and can fix them

> Response must be given within 3 seconds. `private_metadata` — context, up to 3000 chars.

