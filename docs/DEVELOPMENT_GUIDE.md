# Development Guide

**Last Updated**: 2024-12-11  
**Purpose**: Developer onboarding and common tasks  
**For LLMs**: Use this to understand development workflow and code patterns

## Getting Started

### Initial Setup

1. Clone repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Add Supabase and Gemini credentials
5. Run database schema: `database/schema.sql` in Supabase
6. Run `npm run dev`

### Project Structure

```
/
├── App.tsx                 # Main app with routing
├── types.ts                # TypeScript definitions
├── services/               # Service layer
│   ├── supabaseClient.ts  # Database client
│   ├── *Service.ts        # Data services
│   ├── geminiService.ts   # AI operations
│   └── emailIntegration.ts # Email sending
├── components/             # React components
│   ├── Layout.tsx         # Main layout
│   └── *.tsx              # Feature components
├── hooks/                 # Custom hooks
├── database/              # Database files
│   ├── schema.sql         # Schema definition
│   └── README.md          # Schema docs
└── docs/                  # Documentation
```

## Code Patterns

### Adding a New Service

1. Create file in `services/`: `services/newService.ts`
2. Follow existing service pattern:
   ```typescript
   export const getItems = async (clubId: string): Promise<Item[]>
   export const createItem = async (clubId: string, item: Omit<Item, 'id'>): Promise<Item>
   export const updateItem = async (id: string, updates: Partial<Item>): Promise<Item>
   export const deleteItem = async (id: string): Promise<void>
   export const subscribeToItems = (clubId: string, callback: (items: Item[]) => void)
   ```
3. Add table name to `TABLES` in `supabaseClient.ts`
4. Update database schema if needed
5. Add JSDoc comments

### Adding a New Component

1. Create file in `components/`: `components/NewComponent.tsx`
2. Use TypeScript interfaces for props
3. Follow existing component patterns:
   - Glassmorphism styling
   - Loading states
   - Error handling
   - Responsive design
4. Import from `services/` for data operations
5. Use `useSupabaseQuery` for data fetching

### Adding a New AI Function

1. Add function to `services/geminiService.ts`
2. Follow prompt engineering patterns (see `docs/AI_PROMPTS.md`)
3. Include club context in prompts
4. Handle errors gracefully
5. Document prompt in `docs/AI_PROMPTS.md`

### Adding a New Database Table

1. Update `database/schema.sql`:
   - Add table definition
   - Add indexes
   - Add triggers
   - Add RLS policies
2. Create service file: `services/newService.ts`
3. Add TypeScript interface to `types.ts`
4. Update `docs/DATA_MODEL.md`
5. Run migration in Supabase

## Common Tasks

### Adding a New Content Type

1. Update `ContentType` in `types.ts`
2. Add prompt logic in `generateContent()` in `geminiService.ts`
3. Update content filter in `ContentPipeline.tsx`
4. Add to database schema CHECK constraint

### Adding a New Player Stat

1. Update `PlayerStats` interface in `types.ts`
2. Update database schema (JSONB structure)
3. Update `RadarChart.tsx` if needed
4. Update player form modal

### Adding Real-time Updates

1. Use `useRealtimeSubscription` hook
2. Call service's `subscribeTo*` function
3. Update state in callback
4. Clean up subscription on unmount

### Debugging

**Database Issues**:
- Check Supabase Dashboard → Logs
- Verify RLS policies
- Check table structure matches schema

**AI Generation Issues**:
- Check API key is valid
- Verify prompt format
- Check response in browser console
- Review Gemini API quotas

**Component Issues**:
- Check browser console for errors
- Verify props are passed correctly
- Check service function returns expected data

## Testing Guidelines

### Unit Tests

Test service functions:
```typescript
// tests/services/playerService.test.ts
import { describe, it, expect } from 'vitest';
import { getPlayers } from '../services/playerService';

describe('playerService', () => {
  it('should fetch players for a club', async () => {
    const players = await getPlayers('club-id');
    expect(Array.isArray(players)).toBe(true);
  });
});
```

### Integration Tests

Test component-service integration:
- Mock Supabase client
- Test data flow
- Verify error handling

### Manual Testing Checklist

- [ ] Create player
- [ ] Update player
- [ ] Delete player
- [ ] Generate content
- [ ] Save sponsor content
- [ ] Send email
- [ ] AI conversation history

## Code Style

### TypeScript

- Use strict typing
- Avoid `any` type
- Use interfaces for props
- Export types from `types.ts`

### React

- Use functional components
- Use hooks for state
- Extract reusable logic to hooks
- Keep components focused

### Naming Conventions

- Components: PascalCase (`PlayerCard.tsx`)
- Services: camelCase (`playerService.ts`)
- Functions: camelCase (`getPlayers`)
- Types/Interfaces: PascalCase (`Player`, `PlayerStats`)
- Constants: UPPER_SNAKE_CASE (`TABLES`)

### File Organization

- One component per file
- One service per entity
- Group related types together
- Keep imports organized

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Create PR with description
6. Request review
7. Merge after approval

## Performance Optimization

### Database Queries

- Use indexes for frequently queried fields
- Limit result sets with pagination
- Use select() to fetch only needed fields
- Avoid N+1 queries

### React Performance

- Use `React.memo()` for expensive components
- Memoize callbacks with `useCallback`
- Memoize computed values with `useMemo`
- Lazy load routes if needed

### AI Operations

- Cache AI responses where possible
- Batch similar requests
- Use streaming for long responses
- Monitor API usage

## Documentation Updates

When making changes, update:

1. **Code Comments**: Add JSDoc to new functions
2. **Type Definitions**: Update `types.ts`
3. **API Docs**: Update `docs/API_DOCUMENTATION.md`
4. **Data Model**: Update `docs/DATA_MODEL.md` if schema changes
5. **AI Prompts**: Update `docs/AI_PROMPTS.md` if prompts change
6. **Context Guide**: Update `docs/CONTEXT.md` if architecture changes

## Troubleshooting

### "Module not found"

- Check import paths
- Verify file exists
- Check case sensitivity
- Restart dev server

### "Type error"

- Check TypeScript types match
- Verify interface definitions
- Check for missing properties
- Review type imports

### "Database error"

- Check Supabase connection
- Verify table exists
- Check RLS policies
- Review error message in Supabase logs

### Database Setup Issues

**409 Duplicate Key Error**:
- Cause: Inserting record that already exists (unique constraint violation)
- Fix: Use `upsert()` with `onConflict` clause instead of `insert()`
- Example:
  ```typescript
  await supabase
    .from('table')
    .upsert({ ...data }, { onConflict: 'unique_column', ignoreDuplicates: false })
  ```

**403 RLS Violation**:
- Cause: User doesn't have permission to insert/select due to Row Level Security
- Fix: Check RLS policies in database or use service role for seeding
- For development: Temporarily disable RLS with `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;`

**404 Table Not Found**:
- Cause: Table doesn't exist in database
- Fix: Run latest migration or apply `database/schema.sql`

### "AI generation slow"

- Check API quota
- Verify network connection
- Consider caching responses
- Check prompt complexity

## Best Practices

### Data Operations

- Always use service layer (never direct Supabase calls in components)
- Handle errors gracefully
- Show loading states
- Provide user feedback

### Component Design

- Keep components focused and small
- Extract reusable logic to hooks
- Use TypeScript for type safety
- Follow existing patterns

### Error Handling

- Catch errors in async operations
- Show user-friendly messages
- Log errors for debugging
- Don't expose sensitive information

### Security

- Never commit API keys
- Use environment variables
- Validate user input
- Sanitize data before saving

## Resources

- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs

## Getting Help

1. Check documentation files in `docs/`
2. Review existing code patterns
3. Check Supabase dashboard for database issues
4. Review browser console for errors
5. Check network tab for API issues










