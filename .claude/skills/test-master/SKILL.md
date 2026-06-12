---
name: test-master
description: >
  QA specialist for writing Jest unit and integration tests for the NestJS backend.
  Use when adding tests for services, controllers, utilities, or CSV parsers.
  Enforces happy path + error cases, descriptive names, no shared state.
  Trigger words: write tests, add tests, test coverage, test this service, test this function,
  missing tests.
argument-hint: <file-or-function-to-test>
---

# Test Master

Write thorough, maintainable Jest tests for: $ARGUMENTS

---

## Stack

- **Framework:** Jest via `@nestjs/testing`
- **Test files:** Co-located `.spec.ts` files in `backend/src/` (e.g. `races.service.spec.ts`)
- **E2E tests:** `backend/test/` directory
- **Run command:** `pnpm --filter backend test`

---

## Process

1. Read the service/controller/module to test — understand inputs, outputs, and side effects
2. Identify all meaningful test cases (see categories below)
3. Check for existing `.spec.ts` files to avoid duplication
4. Write tests following the standards below
5. Run `pnpm --filter backend test` — fix any failures before reporting done

---

## What to Test

### Services
- Happy path: correct return values given valid input
- Error paths: DB failure, external service timeout, missing entity (should throw `NotFoundException`)
- Edge cases: empty arrays, null inputs, boundary values

### Controllers
- Successful response shape and HTTP status
- Error response when service throws — correct HTTP exception propagated
- DTO validation rejects invalid input

### CSV Parser / Utilities
- Valid input produces correct output
- Invalid/malformed CSV throws or returns descriptive errors
- Every branch of logic (if/else, switch cases)

---

## Standards

```ts
// Descriptive names: "should {behaviour} when {condition}"
it('should throw NotFoundException when race does not exist', async () => { ... })

// Arrange → Act → Assert
it('should return paginated races', async () => {
  // Arrange
  racesRepository.findAndCount.mockResolvedValue([[mockRace], 1]);
  // Act
  const result = await service.findAll({ page: 1, limit: 10 });
  // Assert
  expect(result.data).toHaveLength(1);
  expect(result.total).toBe(1);
});
```

**Always:**
- Test both success and failure paths
- Mock external dependencies (TypeORM repository, OpenAI, Qdrant)
- Use `beforeEach` to reset state — never share mutable state between tests
- Assert on specific values, not just truthiness

**Never:**
- Arbitrary `setTimeout` — use Jest fake timers if needed
- Call real external APIs or databases
- Leave `console.log` in tests
- Write tests just to hit coverage numbers — test meaningful behaviour

---

## Mocking Patterns

```ts
// Mock TypeORM repository
const mockRacesRepository = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

// NestJS test module setup
const module = await Test.createTestingModule({
  providers: [
    RacesService,
    { provide: getRepositoryToken(Race), useValue: mockRacesRepository },
  ],
}).compile();

// Reset mocks between tests
beforeEach(() => jest.clearAllMocks());
```

---

## Run Tests

```bash
pnpm --filter backend test                                   # all tests
pnpm --filter backend test -- races.service.spec.ts          # single file
pnpm --filter backend test:cov                               # with coverage
```