---
title: "API types"
---

The types and zod schemas the web and admin apps use for API requests and responses are generated from the API's NestJS controllers. Change a controller or a DTO, then regenerate:

```bash
pnpm generate:api-types
```

The command builds the API, then runs two generators:

1. `@nestjs/swagger` writes the API's OpenAPI document to `apps/api/dist/openapi.json`, from the controllers and their DTO classes.
2. `@hey-api/openapi-ts` turns that document into the types and zod schemas in `packages/shared/src/api-types/generated/`.

Only the generated files are committed. CI runs the command again and fails when its output differs from them. Never edit them by hand.

## Writing a route

The `@nestjs/swagger` compiler plugin reads the TypeScript types of controllers and DTOs at build time, so most routes need no decorator.

- Declare request and response classes in a `*.dto.ts` file. The plugin only reads DTOs from those files: a class declared in a `*.controller.ts` file comes out as an empty schema.
- Return a class from every route, such as `Promise<AuthSessionResponseDto>`. The plugin cannot read a `type` alias or an inferred object, so either comes out as an untyped object. Routes that return `{}` use `EmptyResponseDto`.
- A JSDoc comment on a DTO property becomes its description in the generated types.
- A union of classes, or a property typed `null`, needs an explicit `@ApiOkResponse` or `@ApiProperty` schema.

## Using the types

Each route gets types named after its controller and method. `AuthController.signInWithEmail` gives `AuthSignInWithEmailData` and `AuthSignInWithEmailResponse`, exported by `@oboku/shared`:

```ts
signUp = (data: AuthRequestSignUpData["body"]) =>
  this.postOrThrow<AuthRequestSignUpResponse, AuthRequestSignUpData["body"]>(
    `${API_URL}/auth/signup`,
    { body: data },
  )
```

`Data` holds the route's `body`, its `path` and `query` parameters, and its `url`. Typing a call with them keeps it in step with the route when the route's DTOs change.

The DTO classes are exported under their own names too, such as `AuthSessionResponseDto`, for code that handles a shape several routes return.

Responses and DTOs also have a zod schema named after their type with a `z` prefix, such as `zWebGetConfigResponse`, and a route's parameters have schemas such as `zAuthSignInWithEmailBody` and `zNotificationsArchivePath`. Validate API data at runtime with these instead of writing a schema: the web app checks the config it restores from local storage with `zWebGetConfigResponse`.

## Documented modules

The document only covers the modules listed in `documentedModules` in `apps/api/src/generate-openapi.ts`. It lists every module with a controller except `CoversModule`, whose routes serve cover images.

To move a module over:

1. Move its DTOs into `*.dto.ts` files and give each route a response class.
2. Add the module to `documentedModules`.
3. Run `pnpm generate:api-types`, switch the clients to the generated types, and delete the hand-written ones.
