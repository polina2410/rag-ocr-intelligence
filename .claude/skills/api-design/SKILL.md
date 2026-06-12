---
name: api-design
description: >
  API design principles for NestJS REST endpoints. Activate when adding or modifying
  controllers, services, or DTOs. Covers module structure, DTO validation, error handling,
  and response shape conventions.
argument-hint: review|new
---

# API Design Principles

Guidance for designing and reviewing NestJS endpoints in this project.

## When to Use

- Adding a new feature module under `backend/src/<feature>/`
- Modifying an existing controller or service
- Adding or changing DTOs in `dto/`
- Reviewing an existing endpoint for correctness

## Task

$ARGUMENTS

| Action | Description |
|--------|-------------|
| `review` | Audit an existing endpoint against these principles |
| `new` | Design a new endpoint — walk through the checklist below |

---

## Core Principles

### 1. Module Structure

Every feature follows the same layout:
```
backend/src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
  entities/
    <feature>.entity.ts
```

Controllers are thin — receive request, call service, return response:
```typescript
// Good
@Post()
create(@Body() dto: CreateRaceDto): Promise<Race> {
  return this.racesService.create(dto);
}

// Bad — logic in controller
@Post()
async create(@Body() dto: CreateRaceDto) {
  const race = new Race();
  race.name = dto.name;
  await this.dataSource.getRepository(Race).save(race);
  return race;
}
```

### 2. DTO Validation

All incoming data must be validated with `class-validator` decorators:
```typescript
export class CreateRaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  distanceKm: number;
}
```

Enable global validation pipe in `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

### 3. Error Handling

Use NestJS built-in HTTP exceptions — never throw raw `Error`:
```typescript
// Good
throw new NotFoundException(`Race #${id} not found`);
throw new BadRequestException('File must be a CSV');
throw new UnprocessableEntityException('CSV contains invalid data');

// Bad
throw new Error('not found');
return null; // never return null for missing resources
```

### 4. Response Shape

- **Success (list):** `{ data: T[], total: number, page: number, limit: number }`
- **Success (single):** the entity/DTO directly
- **Error:** NestJS exception format — `{ statusCode, message, error }`
- Never return different shapes for the same endpoint

### 5. Pagination

All list endpoints must accept and apply pagination:
```typescript
@Get()
findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
  return this.service.findAll({ page: +page, limit: +limit });
}
```

### 6. OpenAI Calls

OpenAI SDK calls belong exclusively in a dedicated service — never inline in controllers or other services:
```typescript
// Good — in GenerateService
async generate(prompt: string): Promise<string> { ... }

// Bad — inline in RacesController
const completion = await this.openai.chat.completions.create(...);
```

---

## Checklist for New Endpoints

- [ ] Feature module created with module / controller / service files
- [ ] DTO defined with `class-validator` decorators for all inputs
- [ ] Controller delegates all logic to service
- [ ] Correct HTTP exception thrown for all error paths
- [ ] List endpoint is paginated
- [ ] Swagger decorators added (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
- [ ] No `any` types in method signatures

---

## What NOT to Do

- Do not put TypeORM queries directly in controllers
- Do not return raw TypeORM entities with sensitive/internal fields — use DTOs
- Do not use `any` as a return type
- Do not swallow errors silently — always throw an HTTP exception
- Do not put OpenAI calls outside of their dedicated service