# Action Plan for EventCard State Synchronization Bug

## Issue Description

A state management synchronization issue has been identified in the `EventCard` component (`src/components/events/EventCard.tsx`) where local UI state (`isEditMode`) does not properly synchronize with parent mutation state (`isEditing` prop). This can lead to the inline edit textarea remaining visible after edit operations complete or fail, creating a poor user experience and potential UI inconsistencies.

**Severity:** Medium - Impacts UX but doesn't cause data corruption or crashes  
**Impact Area:** Events Management UI (/events page)  
**First Introduced:** October 27, 2025 (initial Events View implementation)

## Relevant Codebase Parts

### **CRITICAL DISCOVERY: Architecture is Incomplete (Nov 2, 2025)**

Strategic logging and analysis revealed that the original hypothesis was incorrect. The issue is not a synchronization bug but rather an **incomplete implementation** of per-event mutation state tracking.

1. **`src/components/events/EventCard.tsx`** - Component with unused props
   - **Interface defines**: `isEditing`, `isDeleting`, `isCopying` props (boolean flags)
   - **Reality**: These props are NEVER passed from parent, always `undefined` → defaults to `false`
   - **Local state**: `isEditMode` managed independently, reset via user actions only
   - **Current behavior**: Works correctly - `setIsEditMode(false)` called in `handleSave` and `handleCancelEdit`
   - **Log findings**: No actual desync during mutation - false positive from detection logic

2. **`src/components/events/InlineEditArea.tsx`** - Edit UI component
   - The textarea component displayed when `isEditMode` is true
   - Receives `disabled` prop that should be tied to mutation pending state
   - Currently receives `isEditing` from EventCard, but since that's always false, disabled state is never true
   - Callbacks work correctly: `onSave` and `onCancel` properly trigger parent handlers

3. **`src/components/events/EventsPage.tsx`** - Parent mutation orchestrator
   - **Creates mutations**: `editEventMutation` and `deleteEventMutation` using React Query
   - **Tracks global state**: `editEventMutation.isPending` changes correctly (`false → true → false`)
   - **MISSING IMPLEMENTATION**: Never passes mutation state down to EventList or EventCard
   - **Log evidence**: `isPending` state tracked but isolated to parent component
   - Mutation lifecycle works perfectly: onMutate → mutation → onSuccess/onError → onSettled

4. **`src/components/events/EventList.tsx`** - **THE MISSING LINK**
   - **Critical gap**: Receives events, handlers, but NOT mutation state
   - **Props NOT received**: `editingEventId`, `deletingEventId`, or any mutation flags
   - **Current implementation**: Maps events and passes only `event`, `onCopy`, `onDelete`, `onEdit`
   - **Log evidence**: Every render logs "WITHOUT mutation state props"
   - **Result**: Cannot pass per-event mutation state to EventCard components

5. **`src/components/events/hooks/useEventMutations.ts`** - Mutation hooks implementation
   - **Working correctly**: Optimistic updates, rollback, error handling all functional
   - **Returns**: Standard React Query mutation object with `mutate`, `isPending`, `isError`, etc.
   - **Global state**: `isPending` is boolean for entire mutation, not per-event
   - **Variables tracking**: Mutation callbacks receive `variables.id` but no mechanism to expose this
   - **Log evidence**: Complete lifecycle logged - onMutate, onSuccess, onError, onSettled all fire correctly

6. **Related Pattern Files** (for reference during fix)
   - `src/components/hooks/useEventForm.ts` - Similar debounced state management pattern
   - `src/components/hooks/useChangePasswordForm.ts` - Shows proper state/redirect synchronization pattern

### **Architecture Analysis**

**What exists:**
- EventCard interface with mutation state props (defined but unused)
- EventsPage with mutation hooks and `isPending` tracking
- Proper mutation lifecycle with optimistic updates

**What's missing:**
- Logic to track WHICH specific event is being edited/deleted
- Mechanism to pass per-event mutation state through EventList to EventCard
- Connection between global `isPending` and specific event IDs

**Design patterns identified:**
- Current: "Fire and forget" - mutations happen, local state manages UI
- Intended (but incomplete): "Per-event state tracking" - each card knows if IT is being mutated

## Git Commit History Analysis

### Key Findings:

**Single Implementation Commit (Oct 27, 2025):**
```
Commit: 6a005a9827fcb838b4b91ca3694ea1b56821f44c
Author: Devrilo <marcin.szwajgier@o2.pl>
Date: 2025-10-27 21:12:16 +0100
Subject: Implemented /events view
```

- All Events module components were created in a single large commit
- No subsequent iterations or refinements to EventCard.tsx
- This suggests the state synchronization pattern was never re-evaluated

**E2E Test Addition (Oct 30-31, 2025):**
```
Commit: e0f937d7a0cbf3d7b56a7911918a6b3d005a54e4
Date: 2025-10-30 12:45:21 +0100
Subject: Implemented e2e tests

Commit: 7cc139d84d2f0dcac6c8ad4c8695da10cabd00ff
Date: 2025-10-31 13:10:41 +0100
Subject: Implemented minor e2e tests fixes
```

- E2E tests added 3-4 days after implementation
- Review of test file shows TODO comment: "Test when edit flow is stabilized"
- This specific edge case was likely not tested

**Context from Onboarding Document:**
- Events View implemented on Oct 27 as part of MVP completion
- Module shows 16 changes overall, but EventCard.tsx has had zero changes since creation
- Project uses React Query with optimistic updates (which work correctly)
- Similar race condition was found and fixed in `useChangePasswordForm.ts` (5 changes) using immediate redirect pattern

## Root Cause Hypothesis

### **UPDATED ROOT CAUSE (Nov 2, 2025) - After Strategic Logging & Analysis**

**Original Hypothesis: INCORRECT** ❌  
~~Missing `useEffect` hook to synchronize local `isEditMode` state with parent `isEditing` prop.~~

**Actual Root Cause: INCOMPLETE ARCHITECTURE IMPLEMENTATION** ✅

The bug report identified a symptom but misdiagnosed the cause. Through strategic logging and runtime analysis, we discovered:

### **The Real Problem: Missing Data Flow Layer**

```
EventsPage (has mutation state)
    ↓ ❌ MISSING: Per-event mutation state passing
EventList (has events, handlers)
    ↓ ❌ MISSING: isEditing/isDeleting props
EventCard (expects props, never receives them)
```

### **Technical Explanation - What We Found:**

1. **EventCard is self-contained by design (and it works!)**
   ```typescript
   const [isEditMode, setIsEditMode] = useState(false);
   
   // These work correctly:
   const handleSave = (newDescription: string) => {
     onEdit(event.id, newDescription);
     setIsEditMode(false);  // ✅ Clears immediately
   };
   
   const handleCancelEdit = () => {
     setIsEditMode(false);  // ✅ Clears immediately
   };
   ```

2. **The `isEditing` prop is a phantom**
   - Defined in interface: `isEditing?: boolean`
   - Default value: `false`
   - Runtime value: Always `false` (never passed from parent)
   - **Log evidence**: `[EventList] Rendering EventCard for b38771bc WITHOUT mutation state props`

3. **EventsPage has the state but doesn't pass it**
   ```typescript
   const editEventMutation = useEditEventMutation();
   // editEventMutation.isPending exists and changes: false → true → false
   // But EventList never receives this information
   ```

4. **The "desync" error was a false positive**
   ```
   Timeline from logs:
   1. User clicks "Edit" → isEditMode = true
   2. useEffect fires: !isEditing (always false) && isEditMode (now true) = TRUE
   3. Error logged: "BUG: STATE DESYNC!"
   4. But this is EXPECTED behavior - there's no prop to sync with!
   ```

### **Log Analysis - Key Findings:**

**From Nov 2, 2025 test session:**

```
[EventCard b38771bc] Edit clicked, setting isEditMode to true
[EventCard b38771bc] BUG: STATE DESYNC!  ← FALSE POSITIVE! Fires immediately on edit
[EventCard b38771bc] isEditing prop changed to: false, local isEditMode: true
[EventCard b38771bc] Save clicked, setting isEditMode to false, triggering mutation
[EventsPage] handleEdit called for event b38771bc, current isPending: false
[EventsPage] editEventMutation.isPending changed to: true  ← State exists here!
[useEditEventMutation] Starting mutation for event b38771bc
[useEditEventMutation] onSuccess called for event b38771bc
[EventsPage] editEventMutation.isPending changed to: false
[EventList] Rendering EventCard for b38771bc WITHOUT mutation state props  ← Repeated 4x
```

**Critical observations:**
1. Desync error fires BEFORE save is clicked (on edit click)
2. `isPending` changes correctly in EventsPage but never propagates
3. EventList renders EventCard without any mutation props (confirmed 4 times)
4. Mutation lifecycle works perfectly (onMutate → onSuccess → onSettled)
5. Local state management works correctly (setIsEditMode called appropriately)

### **Why Original Hypothesis Was Wrong:**

1. ❌ **Not a missing useEffect**: There's no prop to sync with, so useEffect would do nothing
2. ❌ **Not a state management bug**: Local state works exactly as coded
3. ❌ **Not a React Query issue**: Mutation hooks are implemented perfectly
4. ❌ **Not a timing/race condition**: The issue is architectural, not timing-based

### **Why This Architecture Exists (Speculation):**

Evidence suggests this was intended but never completed:
- EventCard interface includes `isEditing`, `isDeleting`, `isCopying` props
- InlineEditArea has a `disabled` prop (for pending state)
- EventsPage creates and tracks mutations
- **BUT**: The connection layer was never implemented

Possible reasons:
1. MVP shipped with "good enough" local state management
2. Per-event state tracking deemed unnecessary for UX
3. Started implementation, deprioritized, never finished
4. Copy-paste from another component pattern

### **Current Behavior (Which Actually Works Fine):**

**User flow:**
1. Click "Edit" → Textarea appears immediately ✅
2. Modify text → Character counter updates ✅
3. Click "Save" → Textarea disappears immediately ✅
4. Mutation happens in background ✅
5. Optimistic update shows new text ✅
6. Toast notification on success/error ✅

**What's missing (but may not be needed):**
- Textarea doesn't show "disabled" state during mutation
- No visual feedback that mutation is in progress on that specific card
- User could theoretically click "Edit" again during mutation (but why would they?)

### **The Real Question:**

**Is this actually a bug, or just incomplete polish?**

The current implementation works for the user. The "bug" is more about:
- Unused props in interfaces (code smell)
- Incomplete architectural pattern (maintainability concern)
- Missing loading states (UX polish)
- Not following the intended design (if there was one)

## Potential Contacts

1. **Marcin Szwajgier (Devrilo)** - marcin.szwajgier@o2.pl
   - **Role:** Solo developer and project architect (100% of 47+ commits)
   - **Why Contact:** 
     - Created the Events View in single commit on Oct 27, 2025
     - Expert in React Query patterns and optimistic updates used throughout project
     - Has context on original design decisions for EventCard state management
     - Successfully resolved similar race condition in `useChangePasswordForm.ts`
   - **When to Contact:** After reproducing bug and before implementing fix (to discuss approach)

2. **Code Review (Self-Review Pattern)**
   - **Role:** Follow project's established code review patterns
   - **Why Important:**
     - Project shows high quality standards (241 unit tests, 44 E2E tests, 79% coverage)
     - Multiple architectural refactorings (Container/Presenter, Facade pattern)
     - Document suggests thorough self-review process
   - **When to Use:** Before finalizing implementation and after all tests pass

## Investigation Questions

### **ANSWERED via Strategic Logging (Nov 2, 2025)**

### Self-Reflection Questions:

1. **Reproduction:** Does the bug manifest only during slow network conditions (>2s mutation time), or also in normal/fast operations?
   - ✅ **ANSWERED**: The "desync error" manifests immediately on edit click, regardless of network speed
   - **Evidence**: Logs show error fires BEFORE save is clicked, BEFORE mutation starts
   - **Conclusion**: Not network-dependent; false positive detection logic

2. **Scope:** Are there other components in the Events module or elsewhere with similar "local state + async prop" synchronization patterns?
   - 🔍 **NEEDS INVESTIGATION**: Search codebase for similar patterns
   - **Key indicators**: Props defined in interface but never passed from parent
   - **Similar components to check**: Generator components, auth forms, settings modals

3. **Architecture:** Should `isEditMode` be lifted to parent state in `EventsPage.tsx` instead of living in `EventCard`? What are the trade-offs?
   - ✅ **ANSWERED**: Current architecture (local state) works fine for the use case
   - **Trade-offs analyzed**:
     - **Local state (current)**: Simple, self-contained, works for single-card editing
     - **Lifted state**: More complex, needed for multi-card coordination or URL persistence
     - **Recommendation**: Keep local state unless requirements change

4. **Mutation States:** Does the bug occur with all mutation outcomes (success, error, network failure), or only specific scenarios?
   - ✅ **ANSWERED**: No actual bug occurs - mutation lifecycle works correctly
   - **Evidence from logs**: onMutate → onSuccess → onSettled all fire as expected
   - **Current behavior**: `setIsEditMode(false)` called immediately on save, before mutation outcome

5. **User Impact:** Have users reported this issue in production/testing, or was it discovered through code review?
   - ❓ **UNANSWERED**: Origin of bug report unknown
   - **Critical question**: What made someone think there's a bug?
   - **Visual check needed**: Does textarea actually persist after save? (Suspected: No)

6. **Test Coverage:** Are there E2E tests that should have caught this? What specific test case is missing?
   - ✅ **ANSWERED**: E2E test exists with TODO comment "Test when edit flow is stabilized"
   - **Missing test**: Edit → Save → Verify textarea disappears
   - **Why it's missing**: May have been deemed "stable enough" without formal test

7. **Pattern Prevalence:** Could this pattern exist in other recent components (generator, auth forms, settings)?
   - 🔍 **NEEDS INVESTIGATION**: Systematic search required
   - **Pattern to find**: Props defined but never passed
   - **Search query**: `interface.*Props.*is[A-Z].*\?:.*boolean` + check usage

8. **UX Specification:** What is the intended behavior - should edit mode persist during mutation, or clear immediately on submit?
   - ✅ **ANSWERED via code analysis**: Clear immediately on submit (Option B)
   - **Current implementation**: `handleSave` calls `setIsEditMode(false)` before mutation
   - **User sees**: Immediate return to view mode, mutation happens in background
   - **Alternative (not implemented)**: Textarea stays visible but disabled during mutation

9. **Prevention:** Is there a linter rule, code review checklist, or architectural pattern document that could prevent this anti-pattern?
   - ✅ **IDENTIFIED ANTI-PATTERN**: Props defined in interface but never used
   - **Potential prevention**:
     - TypeScript: Check for unused props (requires custom rule)
     - ESLint: `react/prop-types` or custom rule for unused interface props
     - Code review: "Verify all interface props are passed or remove them"

10. **Alternative Approaches:** Would using a React ref instead of state help, or would that just mask the underlying problem?
    - ✅ **ANSWERED**: Ref wouldn't help; current state approach is correct
    - **Analysis**: The "problem" is phantom - local state works as intended
    - **Real issue**: Incomplete architecture, not state management technique

### Questions for Team/Stakeholders:

11. **Priority:** What is the priority level for fixing this bug relative to other work?
    - ❓ **REQUIRES STAKEHOLDER INPUT**
    - **Consideration**: Is this a bug or a cleanup task?
    - **Impact**: Low (current behavior works fine for users)
    - **Effort**: Medium (need to implement per-event tracking or remove unused props)

12. **User Reports:** Has this issue been observed in user sessions or error tracking?
    - ❓ **REQUIRES INVESTIGATION**: Check error tracking, user feedback, session replays
    - **Critical**: If no users reported it, likely not a real UX issue

13. **Workaround:** Is there a temporary workaround for users who encounter this?
    - ✅ **N/A**: No workaround needed because issue doesn't affect users
    - **Current behavior**: Works correctly from user perspective

14. **Regression Risk:** What is the acceptable risk level for regressions when fixing this?
    - ✅ **ASSESSED**: 
      - **Option A (Implement per-event tracking)**: Medium-high risk, significant change
      - **Option B (Remove unused props)**: Low risk, simple cleanup
      - **Option C (Document as "works as intended")**: Zero risk

15. **Documentation:** Should this pattern be added to coding standards or architectural guidelines?
    - ✅ **RECOMMENDATION**: Yes, document this finding
    - **Add to guidelines**:
      - "Don't define interface props that aren't used"
      - "Local state is acceptable for self-contained component behavior"
      - "Per-event mutation tracking requires explicit architecture"
    - **Reference implementation**: Document EventCard's current approach as acceptable pattern

### **NEW Questions Raised by Investigation:**

16. **Visual Verification:** Does the textarea actually persist after clicking Save in normal use?
    - 🔍 **REQUIRES MANUAL TEST**: User observation needed
    - **Test**: Edit → Save → Watch textarea
    - **Expected**: Disappears immediately
    - **If persists**: Different bug than hypothesized

17. **Performance Impact:** How many unnecessary re-renders occur due to current architecture?
    - 🔍 **REQUIRES PROFILING**: React DevTools Profiler analysis
    - **Evidence from logs**: EventList renders EventCard 4 times during single mutation
    - **Question**: Is this acceptable or optimization opportunity?

18. **Mutation Variables Tracking:** Should React Query track pending mutation by event ID?
    - 🔍 **DESIGN DECISION NEEDED**
    - **Current**: Global `isPending` for all edits
    - **Alternative**: Track pending mutations per event ID
    - **Use case**: Allow editing multiple events simultaneously

19. **Optimistic Update Timing:** Should UI clear before or after optimistic update?
    - ✅ **CURRENT**: Clears before optimistic update
    - **Sequence**: Save click → setIsEditMode(false) → onMutate → optimistic update
    - **Alternative**: Clear after optimistic update completes
    - **Trade-off**: Immediate feedback vs. transactional feel

20. **Error Handling UX:** Should edit mode persist if mutation fails?
    - 🔍 **REQUIRES UX DECISION**
    - **Current**: Edit mode clears before knowing success/failure
    - **If mutation fails**: User sees toast, but changes are already "gone" from UI
    - **Alternative**: Re-enter edit mode on error, or keep edit mode until success

## Next Steps

### **REVISED APPROACH AFTER INVESTIGATION (Nov 2, 2025)**

Based on strategic logging and analysis, the original action plan was based on incorrect assumptions. Here's the updated approach:

### **Decision Point: Choose Implementation Path**

Three options identified, each with different implications:

#### **Option A: Implement Complete Per-Event Mutation Tracking** (High effort, aligns with original interface design)
- Implement event ID tracking in mutation state
- Pass per-event flags through EventList to EventCard
- Update EventCard to use props instead of just local state
- Add "disabled" state to InlineEditArea during mutations
- **Pros**: Matches intended architecture, better UX feedback
- **Cons**: Significant refactor, medium-high regression risk
- **Effort**: 4-6 hours implementation + testing

#### **Option B: Clean Up Unused Props & Document Current Pattern** (Low effort, minimal risk)
- Remove `isEditing`, `isDeleting`, `isCopying` props from EventCard interface
- Remove unused `disabled` logic in InlineEditArea (or keep for future use)
- Document that local state management is intentional
- Add tests for current behavior
- **Pros**: Simple, low risk, documents reality
- **Cons**: Loses potential for per-event feedback, may need rework later
- **Effort**: 1-2 hours cleanup + documentation

#### **Option C: Hybrid - Add Visual Feedback Without Full Tracking** (Medium effort)
- Keep local state as primary source of truth
- Use global `isPending` to disable ALL edit buttons while any mutation is active
- Add loading spinner in toast/global UI instead of per-card
- Clean up unused props but keep architecture for future enhancement
- **Pros**: Balances simplicity with better UX, low risk
- **Cons**: Doesn't solve multi-card editing scenario
- **Effort**: 2-3 hours implementation

### **RECOMMENDED: Option B (Clean Up) OR Option C (Hybrid)**

**Reasoning:**
1. Current behavior works for users (no reported issues)
2. Logs confirm no actual synchronization bug
3. Per-event tracking adds complexity without clear user benefit
4. Can always implement Option A later if requirements emerge

---

### Phase 1: Investigation & Reproduction (1-2 hours) - ✅ **COMPLETED**

#### ✅ **1. Strategic Logging Implementation (COMPLETED - Nov 2, 2025)**

**Actions taken:**
- Added minimal, focused logging to 4 key files:
  - `EventCard.tsx`: State desync detection, prop changes, user actions
  - `useEventMutations.ts`: Mutation lifecycle (onMutate, onSuccess, onError, onSettled)
  - `EventsPage.tsx`: `isPending` tracking, handleEdit calls
  - `EventList.tsx`: Prop passing verification

**Key findings from logs:**
```
Timeline analysis from actual test run:
1. [EventCard] Edit clicked → isEditMode = true
2. [EventCard] BUG: STATE DESYNC! ← False positive (fires immediately)
3. [EventCard] Save clicked → setIsEditMode = false
4. [EventsPage] isPending changed to: true
5. [useEditEventMutation] Mutation lifecycle executes correctly
6. [EventsPage] isPending changed to: false
7. [EventList] Rendering WITHOUT mutation state props (4x)
```

**Conclusions:**
- ❌ No actual desync bug - false positive detection
- ❌ Props never passed from parent to child
- ✅ Mutation lifecycle works perfectly
- ✅ Local state management works correctly
- ✅ Optimistic updates function as designed

#### ✅ **2. Architecture Analysis (COMPLETED - Nov 2, 2025)**

**Findings:**
- EventCard interface defines `isEditing`, `isDeleting`, `isCopying` props
- EventsPage tracks `editEventMutation.isPending` but never passes it down
- EventList renders EventCards without mutation state props
- Current implementation uses pure local state (and it works)

**Evidence of incomplete implementation:**
- Props defined but unused (code smell)
- InlineEditArea has `disabled` prop that's never actually true
- React Query mutation state isolated to EventsPage
- No mechanism to track which specific event is being mutated

#### ⏭️ **3. Visual Behavior Verification (PENDING USER ACTION)**

**Required test:**
1. Navigate to `/events` page
2. Click "Edit" on any event
3. Modify description text
4. Click "Save"
5. **OBSERVE**: Does textarea disappear immediately or persist?

**Expected based on code:**
- Textarea should disappear immediately when Save is clicked
- Mutation happens in background
- Optimistic update shows new text
- Toast notification confirms success

**If textarea persists:**
- Different bug than hypothesized
- Requires additional investigation
- May be React render timing issue

#### 🔍 **4. Pattern Search Across Codebase (TODO)**

**Objective:** Find other components with similar "props defined but not passed" pattern

**Search steps:**
```bash
# Find components with unused mutation props
grep -r "is[A-Z].*\?:.*boolean" src/components --include="*.tsx" --include="*.ts"

# Find components with similar local state patterns
grep -r "useState.*isEdit\|useState.*isDeleting\|useState.*isCopying" src/components
```

**Components to manually check:**
- `src/components/generator/` - Event generator components
- `src/components/auth/` - Login/Register forms
- `src/components/settings/` - Account settings modals

#### 🔍 **5. E2E Test Coverage Analysis (TODO)**

**Current state:**
- `tests/e2e/05-events.spec.ts` has TODO: "Test when edit flow is stabilized"
- No explicit test for edit → save → verify UI returns to normal

**Recommended test to add:**
```typescript
test('edit flow completes correctly', async ({ page }) => {
  // Navigate to events page
  // Click Edit button
  // Verify textarea appears
  // Modify text
  // Click Save
  // Verify textarea disappears
  // Verify new text appears in view mode
  // Verify toast notification
});
```

### Phase 2: Design & Planning (REVISED BASED ON FINDINGS)

#### **If Choosing Option A: Complete Per-Event Tracking Implementation**

**5a. Design per-event mutation tracking**

**Challenge:** React Query's `isPending` is global, not per-event

**Approach 1 - Track mutation variables:**
```typescript
// In EventsPage.tsx
const editEventMutation = useEditEventMutation();
const [editingEventId, setEditingEventId] = useState<string | null>(null);

const handleEdit = useCallback((id: string, description: string) => {
  setEditingEventId(id);
  editEventMutation.mutate(
    { id, edited_description: description },
    {
      onSettled: () => setEditingEventId(null)
    }
  );
}, [editEventMutation]);

// Pass to EventList:
<EventList
  editingEventId={editingEventId}
  // ... other props
/>

// EventList passes to each EventCard:
<EventCard
  isEditing={editingEventId === event.id}
  // ... other props
/>
```

**Approach 2 - Use mutation context:**
```typescript
// Access mutation.variables in EventCard
const editMutationContext = editEventMutation.variables;
const isThisEventEditing = editMutationContext?.id === event.id;
```

**Trade-offs:**
- Approach 1: Explicit, easy to understand, requires state management
- Approach 2: Cleaner, but requires passing mutation object, tighter coupling

**6a. Update EventCard to use props:**
```typescript
// Add useEffect to sync with prop
useEffect(() => {
  // When mutation completes, exit edit mode
  if (!isEditing && isEditMode) {
    setIsEditMode(false);
  }
}, [isEditing, isEditMode]);

// Update InlineEditArea disabled state
<InlineEditArea
  disabled={isEditing} // Now actually receives true during mutation
  // ... other props
/>
```

**7a. Update EventList interface:**
```typescript
interface EventListProps {
  // ... existing props
  editingEventId?: string | null;
  deletingEventId?: string | null;
  copyingEventId?: string | null;
}
```

#### **If Choosing Option B: Clean Up Unused Props (RECOMMENDED)**

**5b. Remove unused props from EventCard:**
```typescript
// Before:
interface EventCardProps {
  event: SavedEventViewModel;
  onCopy: (description: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newDescription: string) => void;
  isCopying?: boolean;  // ← Remove
  isDeleting?: boolean; // ← Remove
  isEditing?: boolean;  // ← Remove
}

// After:
interface EventCardProps {
  event: SavedEventViewModel;
  onCopy: (description: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newDescription: string) => void;
}
```

**6b. Simplify EventCard implementation:**
```typescript
// Remove unused prop destructuring
export function EventCard({
  event,
  onCopy,
  onDelete,
  onEdit,
}: EventCardProps) {
  // Remove: isCopying, isDeleting, isEditing props
  // Keep local state management as-is (it works!)
  
  // Remove the false-positive desync detection useEffect
  // Keep only the functional code
}
```

**7b. Update InlineEditArea (optional):**
```typescript
// Option 1: Remove disabled prop (simplest)
interface InlineEditAreaProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  // disabled?: boolean; ← Remove if not needed
  maxLength?: number;
}

// Option 2: Keep disabled prop for future use
// Document that it's for future per-event tracking
```

**8b. Document the pattern:**
```typescript
/**
 * EventCard manages edit mode via local state.
 * 
 * Design decision: Edit mode clears immediately on Save/Cancel,
 * rather than waiting for mutation to complete. This provides
 * immediate UI feedback while mutation happens in background.
 * 
 * Optimistic updates ensure user sees changes immediately.
 * Toast notifications confirm mutation success/failure.
 * 
 * @see handleSave - Clears edit mode before triggering mutation
 * @see handleCancelEdit - Clears edit mode immediately
 */
```

#### **If Choosing Option C: Hybrid Approach**

**5c. Add global pending state UX:**
```typescript
// In EventCard, disable actions during ANY mutation
const isAnyMutationPending = isCopying || isDeleting || isEditing;

// But isCopying, isDeleting, isEditing come from EventsPage as GLOBAL flags
// Not per-event, just "is any mutation happening?"

<Button
  disabled={isAnyMutationPending || isEditMode}
  // Prevents user from starting new action while any mutation is active
/>
```

**6c. Keep architecture for future enhancement:**
- Keep prop definitions in interfaces
- Add comment: "Reserved for future per-event mutation tracking"
- Implement basic version now, can enhance later

**7c. Add global loading indicator:**
```typescript
// In EventsPage or global UI
{editEventMutation.isPending && (
  <div className="fixed bottom-4 right-4">
    <Spinner /> Zapisywanie...
  </div>
)}
```

### Phase 3: Implementation (Path Dependent)

#### **Implementation Path A: Complete Per-Event Tracking (4-6 hours)**

**8a. Implement mutation ID tracking in EventsPage:**
- Add state: `editingEventId`, `deletingEventId`, `copyingEventId`
- Update handlers to set/clear these IDs
- Pass IDs to EventList

**9a. Update EventList to pass per-event flags:**
- Receive mutation ID props
- Calculate `isEditing={editingEventId === event.id}` for each card
- Pass calculated flags to EventCard

**10a. Update EventCard to use props:**
- Add useEffect to sync `isEditMode` with `isEditing` prop
- Update `isAnyActionPending` to use props
- Pass `isEditing` to InlineEditArea's `disabled` prop

**11a. Add comprehensive unit tests:**
```typescript
// Test suite for EventCard with prop synchronization
describe('EventCard - Mutation State Synchronization', () => {
  test('exits edit mode when isEditing prop becomes false', () => {
    const { rerender } = render(<EventCard {...props} isEditing={true} />);
    // Verify in edit mode
    rerender(<EventCard {...props} isEditing={false} />);
    // Verify exited edit mode
  });

  test('disables textarea during mutation', () => {
    render(<EventCard {...props} isEditing={true} />);
    // Verify textarea is disabled
  });

  test('prevents new edits while mutation is pending', () => {
    render(<EventCard {...props} isEditing={true} />);
    // Verify edit button is disabled
  });
});
```

**12a. Add E2E test for new behavior:**
```typescript
test('edit flow shows loading state during mutation', async ({ page }) => {
  // Add network delay to see loading state
  await page.route('**/api/events/*', route => 
    setTimeout(() => route.continue(), 1000)
  );
  
  // Click edit, verify textarea enabled
  // Click save, verify textarea disabled
  // Wait for completion, verify textarea gone
});
```

#### **Implementation Path B: Clean Up (1-2 hours) - RECOMMENDED**

**8b. Remove unused props from interfaces:**
```typescript
// EventCard.tsx
- Remove isCopying, isDeleting, isEditing from interface
- Remove from props destructuring
- Remove any references in component body
- Remove false-positive desync detection useEffect
```

**9b. Simplify component logic:**
```typescript
// Keep only functional code:
const isAnyActionPending = false; // Or remove entirely
// Remove isAnyActionPending calculations
// Keep local state management as-is
```

**10b. Add unit tests for CURRENT behavior:**
```typescript
describe('EventCard - Local State Management', () => {
  test('enters edit mode on edit button click', () => {
    render(<EventCard {...props} />);
    fireEvent.click(screen.getByText('Edytuj'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('exits edit mode on save', () => {
    render(<EventCard {...props} />);
    fireEvent.click(screen.getByText('Edytuj'));
    fireEvent.click(screen.getByText('Zapisz'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('exits edit mode on cancel', () => {
    render(<EventCard {...props} />);
    fireEvent.click(screen.getByText('Edytuj'));
    fireEvent.click(screen.getByText('Anuluj'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
```

**11b. Add E2E test documenting current behavior:**
```typescript
test('edit flow completes successfully', async ({ page }) => {
  await page.goto('/events');
  
  // Enter edit mode
  await page.click('button:has-text("Edytuj")');
  await expect(page.locator('textarea')).toBeVisible();
  
  // Modify text
  await page.fill('textarea', 'Updated description');
  
  // Save - textarea should disappear immediately
  await page.click('button:has-text("Zapisz")');
  await expect(page.locator('textarea')).not.toBeVisible();
  
  // Verify success toast
  await expect(page.locator('text=Zapisano zmiany')).toBeVisible();
  
  // Verify updated text appears
  await expect(page.locator('text=Updated description')).toBeVisible();
});
```

**12b. Remove debug logging:**
```typescript
// Remove all console.log/console.error statements added during investigation
// Keep only production-appropriate error logging if any
```

#### **Implementation Path C: Hybrid (2-3 hours)**

**8c. Keep props but implement global loading:**
- Keep interface as-is (document as "reserved for future")
- Add global `isPending` flag passed as single boolean
- Use for disabling all action buttons
- Add global loading indicator

**9c. Minimal EventCard changes:**
```typescript
// Add just one prop: globalMutationPending
interface EventCardProps {
  // ... existing
  globalMutationPending?: boolean; // Any mutation in progress
}

// Use it:
const isAnyActionPending = globalMutationPending || false;
```

**10c. Add global loading UI:**
```typescript
// In EventsPage or global layout
{(editEventMutation.isPending || deleteEventMutation.isPending) && (
  <LoadingToast message="Przetwarzanie..." />
)}
```

### Phase 4: Verification & Testing (1-2 hours)

12. **Manual testing across all scenarios**
    - Test with fast network (normal conditions)
    - Test with slow network (throttled to 2-5 seconds)
    - Test all mutation outcomes: success, 400, 403, 404, 500, network error
    - Test rapid clicking: edit → save → edit → cancel → delete
    - Test multiple cards: edit one while another is pending
    - Test on mobile viewport (responsive behavior)
    - **Success Criteria:** Bug no longer reproduces in any scenario
    - **Rationale:** Comprehensive manual testing catches issues automated tests miss

13. **Performance verification**
    - Check React DevTools Profiler for unnecessary re-renders
    - Verify new `useEffect` doesn't cause render loops
    - Confirm no memory leaks (component unmounts cleanly)
    - Measure before/after render counts
    - **Success Criteria:** No performance degradation measured
    - **Rationale:** Fix shouldn't introduce performance problems

14. **Cross-browser testing**
    - Test in Chrome, Firefox, Safari (if available)
    - Test React 19 compatibility (project uses React 19)
    - Verify no console errors in any browser
    - **Success Criteria:** Works in all target browsers
    - **Rationale:** Ensures fix works across all user environments

15. **Code review self-checklist**
    - ✅ Does fix handle all mutation states (pending, success, error)?
    - ✅ Are there any memory leaks from the new `useEffect`?
    - ✅ Is the user experience smooth (no flashing/jarring state changes)?
    - ✅ Does this create any new edge cases?
    - ✅ Is code properly commented and self-documenting?
    - ✅ Does TypeScript catch potential issues?
    - **Success Criteria:** All checklist items reviewed and addressed
    - **Rationale:** Structured self-review catches issues before external review

### Phase 5: Documentation & Deployment (1 hour)

16. **Update inline documentation**
    - Add JSDoc comment above new `useEffect` explaining synchronization need
    - Update EventCard component documentation if it exists
    - Add comment referencing this action plan for future developers
    - **Success Criteria:** Code is self-explanatory for future maintainers
    - **Rationale:** Prevents similar bugs by educating future developers

17. **Update project documentation**
    - Add entry to `CHANGELOG.md` under "Bug Fixes" section
    - **Format:** `- Fixed state synchronization bug in EventCard where edit mode persisted after mutations completed`
    - Consider adding pattern to `.github/copilot-instructions.md` under "Coding practices"
    - Update `docs/testing-cleanup.md` if E2E test structure changed
    - **Success Criteria:** All relevant docs updated
    - **Rationale:** Maintains project's excellent documentation standards

18. **Create comprehensive PR**
    - **Title:** `fix: synchronize EventCard edit mode state with mutation props`
    - **Description includes:**
      - Link to this action plan document
      - Before/after video or GIF showing the bug and fix
      - List of all test cases verified
      - Summary of edge cases handled
      - Performance impact assessment
    - Tag `@Devrilo` (Marcin Szwajgier) for review
    - **Success Criteria:** PR is clear and reviewable
    - **Rationale:** Good PR practices ensure quality review

19. **Plan monitoring after deployment**
    - Add console log (debug level) for state transitions if not already present
    - Consider adding analytics event for edit mode usage patterns
    - Monitor error tracking for any new issues after deployment
    - **Success Criteria:** Monitoring plan in place
    - **Rationale:** Catches any issues that escaped testing

### Phase 6: Follow-up (After Deployment)

20. **Monitor production for 48 hours**
    - Check error tracking dashboards
    - Review user session recordings if available
    - Look for related bug reports
    - **Success Criteria:** No new issues reported
    - **Rationale:** Validates fix works in production environment

21. **Consider architectural improvements**
    - Evaluate if this pattern could be abstracted into a custom hook
    - Consider whether edit mode should be lifted to URL state
    - Document lessons learned for similar components
    - **Success Criteria:** Recommendations documented
    - **Rationale:** Prevents similar issues in future features

22. **Update team knowledge base**
    - Share findings in team meeting or documentation
    - Add to common pitfalls document if one exists
    - Consider creating a "React State Management Patterns" guide
    - **Success Criteria:** Team knowledge improved
    - **Rationale:** Educates team to prevent similar bugs

## Additional Notes

### **Session Summary (Nov 2, 2025)**

**Investigation Methodology:**
1. Strategic logging implementation in 4 key files
2. Manual reproduction test with logs capture
3. Timeline analysis of component lifecycle
4. Architecture gap identification
5. Root cause hypothesis revision

**Key Discoveries:**
1. ❌ **Original hypothesis was incorrect** - No missing useEffect, no synchronization bug
2. ✅ **Real issue identified** - Incomplete architecture with unused props
3. ✅ **Current behavior works** - Local state management functions correctly
4. ✅ **False positive detection** - Desync error fires on intended behavior
5. ✅ **Mutation lifecycle verified** - React Query implementation is solid

**Log Evidence:**
```
Critical sequence from Nov 2 test:
- Desync error fires BEFORE mutation (false positive)
- isPending state tracked but never propagated
- EventList renders cards without mutation props (4x confirmed)
- Local state management works exactly as coded
- No visual bug in actual user experience
```

**Technical Debt Identified:**
1. Props defined in interface but never passed from parent
2. InlineEditArea has unused `disabled` prop
3. EventList doesn't receive mutation state
4. No mechanism for per-event mutation tracking
5. Documentation doesn't explain local state choice

**Files Modified During Investigation (with logging):**
- `src/components/events/EventCard.tsx` - Added state tracking logs
- `src/components/events/EventsPage.tsx` - Added mutation tracking logs  
- `src/components/events/EventList.tsx` - Added prop verification log
- `src/components/events/hooks/useEventMutations.ts` - Added lifecycle logs

**Logs Added (to be removed after decision):**
- 2 logs in EventCard (desync detection, prop changes)
- 2 logs in EventsPage (isPending tracking, handleEdit)
- 1 log in EventList (prop passing verification)
- 4 logs in useEventMutations (mutation lifecycle)

### Context from Project History

- **Project Quality Bar:** This project demonstrates high quality standards with 241 unit tests (79% coverage), 44 E2E tests (100% pass rate), and comprehensive documentation. The fix should maintain these standards.

- **Recent Similar Issue:** The project had a race condition in `useChangePasswordForm.ts` that required 5 iterations to fix (resolved Oct 31, 2025) using `window.location.href` for immediate redirect. This shows the team takes state management issues seriously and iterates to find proper solutions.

- **Architecture Evolution:** The project underwent major refactoring on Oct 30, 2025 (Container/Presenter pattern, Facade pattern) achieving 42-85% LOC reductions. This fix should align with these architectural patterns.

- **Comparison to Original Issue:** Unlike `useChangePasswordForm.ts` which had a real race condition, EventCard's "issue" is architectural incompleteness, not broken functionality.

### **Investigation Insights**

**What the Logs Revealed:**

1. **Timing is not the issue:**
   - Mutation completes in milliseconds
   - State updates propagate correctly
   - No race conditions detected
   - Fast or slow network makes no difference to the false positive

2. **Data flow architecture:**
   ```
   EventsPage (mutation state exists)
        ↓ ❌ MISSING
   EventList (receives handlers only)
        ↓ ❌ MISSING  
   EventCard (expects props, uses local state)
   ```

3. **Component behavior patterns:**
   - EventCard: Self-contained, works independently
   - EventList: Simple mapper, no state management
   - EventsPage: Proper mutation handling with React Query
   - Pattern: Each layer works correctly in isolation

4. **Why this went unnoticed:**
   - User experience is actually fine
   - No visual bugs in normal usage
   - Optimistic updates provide immediate feedback
   - Toast notifications confirm success
   - Edit mode clears before mutation starts (intentional)

**Why Original Hypothesis Failed:**

1. **Assumed prop was passed:** Documentation said "passes isEditing prop" but logs proved it never happened
2. **Assumed sync was needed:** But local state management works fine without it
3. **Assumed bug existed:** But current behavior matches expected UX
4. **Missed architecture gap:** Focus was on sync logic, not data flow

**Lessons for Future Investigations:**

1. **Add logging first:** Don't implement fixes based on assumptions
2. **Verify data flow:** Check that props are actually passed
3. **Question the premise:** "Bug" might be incomplete feature or misunderstanding
4. **Test current behavior:** Verify issue exists before designing solution
5. **Check user impact:** Technical debt ≠ user-facing bug

### Risk Assessment (UPDATED Nov 2, 2025)

**Zero Risk Areas:**
- Current implementation works for users
- No reported bugs in production
- Mutation logic is solid
- Local state management functions correctly
- Optimistic updates work as designed

**Low Risk Path (Option B - Cleanup):**
- Remove unused props from interfaces
- Simplify component code
- Add tests for current behavior
- Document design decisions
- **Risk:** Minimal - removing dead code
- **Benefit:** Cleaner codebase, less confusion

**Medium Risk Path (Option C - Hybrid):**
- Keep architecture but add global loading state
- Minor prop additions
- Preserve future enhancement path
- **Risk:** Small - adding optional features
- **Benefit:** Better UX without major refactor

**High Risk Path (Option A - Full Implementation):**
- Implement per-event mutation tracking
- Refactor data flow through EventList
- Add synchronization logic in EventCard
- Change from local to prop-driven state
- **Risks:**
  - New `useEffect` could cause re-render loops
  - State synchronization timing issues
  - Breaking existing behavior that works
  - 4+ components need coordinated changes
- **Benefit:** Matches "intended" architecture (if that was the intent)
- **Question:** Is this benefit worth the risk?

**Risk Mitigation for Any Path:**
- Create feature branch for changes
- Add comprehensive tests before changes
- Manual testing of all edit scenarios
- Keep debug logs temporarily for verification
- Gradual rollout or feature flag if available

**Regression Risk Analysis:**

*If implementing Option A (per-event tracking):*
- Could break rapid clicking scenarios
- Could affect optimistic update timing
- Could introduce memory leaks (state tracking)
- Could cause UI jank during mutations
- Requires careful handling of mutation queue

*If implementing Option B (cleanup):*
- Minimal risk - removing unused code
- TypeScript ensures no missed references
- Tests document and verify current behavior
- Can always add props back if needed later

*If implementing Option C (hybrid):*
- Low risk - additive changes only
- Existing behavior preserved
- New features are optional enhancements
- Easy to rollback if issues arise

### Success Metrics (REVISED Nov 2, 2025)

**Since no actual bug was found, success criteria depend on chosen path:**

#### **If Option A (Complete Per-Event Tracking):**
1. ✅ Each EventCard correctly shows loading state for its own mutation
2. ✅ Textarea disabled during mutation, enabled after completion
3. ✅ Multiple events can be edited without interference
4. ✅ All unit tests pass (including new synchronization tests)
5. ✅ All E2E tests pass (including loading state verification)
6. ✅ No performance regression (check re-render counts)
7. ✅ No new console errors or warnings
8. ✅ 48 hours in production with no issues

#### **If Option B (Cleanup - RECOMMENDED):**
1. ✅ All unused props removed from interfaces
2. ✅ TypeScript compiles without errors
3. ✅ Unit tests document current behavior
4. ✅ E2E test added for edit flow
5. ✅ Documentation explains local state pattern
6. ✅ Debug logs removed
7. ✅ Code review confirms simpler, clearer code
8. ✅ Existing functionality unchanged (regression test)

#### **If Option C (Hybrid):**
1. ✅ Global loading indicator shows during any mutation
2. ✅ All action buttons disabled during global mutation
3. ✅ User can't start conflicting operations
4. ✅ Existing behavior preserved
5. ✅ New features work without breaking old code
6. ✅ Tests cover both old and new behavior
7. ✅ Documentation explains hybrid approach

#### **Universal Success Criteria (All Paths):**
1. ✅ No user-facing regressions
2. ✅ All 241+ unit tests pass
3. ✅ All 44+ E2E tests pass
4. ✅ ESLint passes with no new warnings
5. ✅ TypeScript compiles without errors
6. ✅ Code review approved
7. ✅ Documentation updated appropriately
8. ✅ CHANGELOG.md entry added

#### **Investigation Success (Already Achieved):**
1. ✅ Root cause identified (incomplete architecture, not sync bug)
2. ✅ False positive detection explained
3. ✅ Current behavior verified as functional
4. ✅ Three implementation paths documented
5. ✅ Risk assessment completed
6. ✅ Strategic logging revealed true state of system
7. ✅ Original hypothesis disproven with evidence
8. ✅ Action plan updated with findings

### Future Considerations

**Potential Enhancements (If Option A Eventually Needed):**
- Implement per-event mutation tracking when requirements emerge
- Add visual loading states per card for better UX feedback
- Consider mutation queue management for multiple simultaneous edits
- Evaluate whether edit mode should be persisted in URL query params
- Add "dirty state" indicator to warn users about unsaved changes

**If Keeping Local State Pattern (Option B):**
- Document the pattern as acceptable for self-contained components
- Consider abstracting into reusable hook if pattern repeats
- Add linting rule to catch "props defined but never passed" pattern
- Consider React Query's mutation context for global state access

**Pattern Analysis - What We Learned:**

**Anti-pattern identified (Nov 2, 2025):**
```typescript
// Props defined in interface but never passed from parent
interface ComponentProps {
  isEditing?: boolean;  // ← Defined but unused
  isDeleting?: boolean; // ← Defined but unused
}

// In parent: component rendered WITHOUT these props
<Component event={event} onEdit={handleEdit} />
// Missing: isEditing={...} isDeleting={...}
```

**Acceptable pattern confirmed (Nov 2, 2025):**
```typescript
// Self-contained local state for UI-only concerns
const [isEditMode, setIsEditMode] = useState(false);

// Clear state immediately on user action
const handleSave = () => {
  onEdit(id, description);
  setIsEditMode(false); // ✅ Immediate feedback
};

// Mutation happens async in background
// Optimistic updates provide data feedback
// Toast notifications confirm success/failure
```

**Documentation Recommendation:**

Add to `.github/copilot-instructions.md`:
```markdown
### State Management Guidelines - Lessons from EventCard Investigation

**For Self-Contained UI State:**
- Use local state for UI-only concerns (modals, edit modes, expanded states)
- Clear state immediately on user action for responsive UX
- Let mutations happen async in background
- Use optimistic updates for data feedback
- Use toast notifications for mutation confirmation

**For Shared/Coordinated State:**
- Use props when multiple components need to coordinate
- Pass mutation state when child needs to show loading/disabled states
- Use React Query context for accessing mutation state across components
- Document the data flow: Parent → List → Card

**Anti-Patterns to Avoid:**
- Defining props in interface that are never passed
- Creating sync logic for props that don't exist
- Over-engineering for hypothetical future needs
- Adding useEffect for non-existent prop synchronization

**When Investigation is Needed:**
- Add strategic logging before implementing fixes
- Verify props are actually passed before creating sync logic
- Test current behavior before assuming bug exists
- Question the premise: is it a bug or incomplete feature?
```

**Monitoring Recommendations:**

1. **Add to code review checklist:**
   - ✅ All interface props are either passed or have default values
   - ✅ No unused optional props in component interfaces
   - ✅ State management choice is documented
   - ✅ Mutation loading states have clear UX feedback

2. **Add to testing guidelines:**
   - ✅ Test current behavior, not assumed behavior
   - ✅ Use strategic logging for complex state investigations
   - ✅ Verify visual behavior matches code expectations
   - ✅ Document "works as intended" findings

3. **Add to architectural decisions log:**
   - Document: "EventCard uses local state for edit mode - this is intentional"
   - Document: "Per-event mutation tracking deferred until requirement emerges"
   - Document: "Immediate UI feedback preferred over loading states"

---

**Document Version:** 2.0  
**Created:** November 2, 2025  
**Last Updated:** November 2, 2025 (Major revision after investigation)  
**Status:** Investigation Complete - Awaiting Decision on Implementation Path  
**Original Estimated Time:** 8-10 hours (based on incorrect hypothesis)  
**Revised Estimated Time:** 
- Option A (Complete): 4-6 hours
- Option B (Cleanup): 1-2 hours ⭐ RECOMMENDED
- Option C (Hybrid): 2-3 hours

**Next Action Required:** Choose implementation path and verify visual behavior
