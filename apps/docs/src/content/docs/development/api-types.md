---
title: "API types"
---

The functions, types and zod schemas the web and admin apps use to call the API are generated from the API's NestJS controllers. Change a controller or a DTO, then regenerate:

```bash
pnpm generate:api-types
```

The command builds the API, then runs two generators:

1. `@nestjs/swagger` writes the API's OpenAPI 3.1 document to `apps/api/dist/openapi.json`, from every controller and its DTO classes.
2. `@hey-api/openapi-ts` turns that document into the functions, types and zod schemas in `packages/shared/src/api-types/generated/`, along with the fetch client the functions run on.

Only the generated files are committed. CI runs the command again and fails when its output differs from them. Never edit them by hand.

## Writing a route

The `@nestjs/swagger` compiler plugin reads the TypeScript types of controllers and DTOs at build time, so most routes need no decorator.

- Declare request and response classes in a `*.dto.ts` file. The plugin only reads DTOs from those files: a class declared in a `*.controller.ts` file comes out as an empty schema.
- Return a class from every route, such as `Promise<AuthSessionResponseDto>`. The plugin cannot read a `type` alias or an inferred object, so either comes out as an untyped object. Routes that return `{}` use `EmptyResponseDto`.
- A JSDoc comment on a DTO property becomes its description in the generated types.
- A union of classes, or a property typed `null`, needs an explicit `@ApiOkResponse` or `@ApiProperty` schema.
- The plugin turns each class-validator decorator into a schema keyword. It cannot see `@ValidateIf` and does not map `@IsInt`, so a property that uses them declares its schema with `@ApiProperty`, like `UpdateInstanceSettingsDto` does.
- A route that returns a file declares its content types with `@ApiProduces` and its body with `@ApiOkResponse({ schema: { type: "string", format: "binary" } })`, like the cover routes.
- Errors need no decorator: `generate-openapi.ts` documents NestJS's error body, `HttpErrorResponseDto`, as the default response of every route. A route whose 400 can carry one of oboku's error codes, `{ errors: [{ code }] }`, adds `@ApiObokuErrors()`, like the sign-in routes.
- A decorator named `Api…Response` must name an error status, like `ApiBadRequestResponse`. The plugin reads any other such name as the route's success response, and stops documenting the one it infers.
- `@ApiExcludeController()` leaves a controller out of the document, like the KOReader sync protocol, which only KOReader devices call.

## Calling a route

Each route gets a function named after its controller and method, exported by `@oboku/shared`: `NotificationsController.list` gives `notificationsList`. It sends the request through the `client` it is given, and resolves with the route's parsed and typed response in `data`:

```ts
const { data } = await notificationsList({ client: httpClientApi.sdkClient })
```

The functions require a `client`:

- In the web app, `HttpApiClientWeb.sdkClient` sends the request through `HttpApiClientWeb`, so it carries the session cookies, is replayed after a refresh on a 401, and fails with an `HttpClientError` that holds the parsed body. The routes that start or end a session go through `HttpApiClientWeb`'s own methods instead, such as `signInWithEmail`, which skip that refresh.
- In the admin app, `apiClient` sends the request with the admin's access token, is replayed after a refresh on a 401, and fails with an `Error` that holds the API's message. Sign-in and the token refresh pass the browser's `fetch` along with it, so they send no token.

Every request to a documented route goes through the functions, except the web app's token refresh, which signs a DPoP proof for its request, and its cover images, which load as `<img>` URLs.

## Using the types

Each route also gets types named after its controller and method. `AdminController.sendEmail` gives `AdminSendEmailData` and `AdminSendEmailResponse`, exported by `@oboku/shared`. A hook types its variables with them:

```ts
mutationFn: async (input: AdminSendEmailData["body"]) => {
  const { data } = await adminSendEmail({ client: apiClient, body: input })

  return data
},
```

`Data` holds the route's `body`, its `path` and `query` parameters, and its `url`. A request that does not go through the functions, like the web app's token refresh, types its request and response with them, which keeps it in step with the route when the route's DTOs change.

The DTO classes are exported under their own names too, such as `AuthSessionResponseDto`, for code that handles a shape several routes return.

Errors are typed the same way: `AuthSignInWithEmailErrors` maps each status the route documents to its body, `ObokuErrorResponseDto` or `HttpErrorResponseDto`. An error body comes from the network, so check it against its zod schema before reading it, like the web app's `isApiError` does with `zObokuErrorResponseDto`.

Responses and DTOs also have a zod schema named after their type with a `z` prefix, such as `zWebGetConfigResponse`, and a route's parameters have schemas such as `zAuthSignInWithEmailBody` and `zNotificationsArchivePath`. Validate API data at runtime with these instead of writing a schema: the web app checks the config it restores from local storage with `zWebGetConfigResponse`. File responses are the exception: their type is `Blob | File`, but the zod plugin generates `z.string()` for them.
