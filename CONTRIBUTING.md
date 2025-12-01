# Contributing to The Gamemaster Screen

Thank you for your interest in contributing to The Gamemaster Screen! This guide will help you add new components or improve existing ones.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Creating a New Component](#creating-a-new-component)
- [Component Requirements](#component-requirements)
- [Registration Process](#registration-process)
- [Styling Guidelines](#styling-guidelines)
- [Testing Your Component](#testing-your-component)
- [Submitting Your Contribution](#submitting-your-contribution)

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm package manager
- Basic knowledge of React hooks and CSS

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/thegamemasterscreen.git
   cd thegamemasterscreen
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm start
   ```

## 🛠️ Creating a New Component

### Step 1: Copy the Template

The easiest way to create a new component is to use our template:

```bash
# Copy the template folder
cp -r src/components/template src/components/my-component

# Rename the files
mv src/components/my-component/Template.js src/components/my-component/MyComponent.js
mv src/components/my-component/Template.css src/components/my-component/MyComponent.css
```

**Important:** Delete the `README.md` file from your component folder - it's only for the template.

### Step 2: Update Component Code

In `MyComponent.js`:

1. **Update imports:**
   ```javascript
   import './MyComponent.css';
   ```

2. **Rename the component:**
   ```javascript
   const MyComponent = ({ onDragStart, onDragEnd, componentKey }) => {
   ```

3. **Update className:**
   ```javascript
   return (
     <div className="my-component">
   ```

4. **Update export:**
   ```javascript
   export default MyComponent;
   ```

### Step 3: Update Component Styles

In `MyComponent.css`:

1. Replace all `.template` class names with `.my-component`
2. Customize colors and layout for your component's needs
3. Consider using shared styles from `src/components-shared.css`:
   - `.component-loading` for loading states
   - `.error-message` for error messages
   - `.empty-message` for empty states
   - `.back-button` for navigation buttons
   - `.dice-roll-link` for clickable dice rolls
   - Scrollbar styling is applied globally

Example:
```css
.my-component {
  background-color: #1e1e1e;
  padding: 8px;
  border-radius: 8px;
  /* ... rest of your styles */
}

.my-component h3 {
  margin: 0;
  padding-left: 28px; /* Space for drag handle */
  color: #a29bfe;
  text-align: center;
  font-size: 14px;
}
```

## 📦 Component Requirements

### ✅ Required Elements

Your component **must** include these elements:

#### 1. Drag Handle
Allows users to move the component around the grid:
```javascript
<div 
  className="component-drag-handle" 
  draggable 
  onDragStart={handleHeaderDragStart} 
  onDragEnd={handleHeaderDragEnd}
>
  ⋮⋮
</div>
```

#### 2. Component Key Prop
Used for state persistence:
```javascript
const MyComponent = ({ onDragStart, onDragEnd, componentKey }) => {
```

#### 3. State Persistence
Both load and save effects:

```javascript
// Load saved state
useEffect(() => {
  const savedState = getComponentState(componentKey);
  if (savedState) {
    if (savedState.myData !== undefined) setMyData(savedState.myData);
    // Load other state variables...
  }
  setIsInitialized(true);
}, [componentKey]);

// Save state when it changes
useEffect(() => {
  if (!isInitialized) return;
  
  saveComponentState(componentKey, {
    myData,
    // Save other state variables...
  });
}, [componentKey, myData, /* other state */, isInitialized]);
```

#### 4. isInitialized Flag
Prevents saving before loading completes:
```javascript
const [isInitialized, setIsInitialized] = useState(false);
```

#### 5. Drag Event Handlers
Handle drag-and-drop functionality:
```javascript
const handleHeaderDragStart = (e) => {
  e.stopPropagation();
  onDragStart?.();
};

const handleHeaderDragEnd = (e) => {
  e.stopPropagation();
  onDragEnd?.();
};
```

### 🎨 Optional Props

Additional props you can use if needed:

```javascript
const MyComponent = ({ 
  onDragStart, 
  onDragEnd, 
  componentKey,
  setGlobalDiceResult,      // For rolling dice
  hideTitles,               // Respect hide-titles setting
  initiativeTrackerRefs,    // Interact with initiative trackers
  defaultName,              // Default name for the component
  componentInstances        // Access to other component instances
}) => {
```

### 💾 State Persistence Best Practices

**What to persist:**
- ✅ User input data (text, numbers, selections)
- ✅ Component configuration (view modes, settings)
- ✅ Lists and collections
- ✅ Last viewed item/state

**What NOT to persist:**
- ❌ Temporary UI state (loading indicators, errors)
- ❌ Derived/calculated values
- ❌ External API data (re-fetch on load)

## 🔌 Registration Process

### Step 1: Register in GridCell.js

Add your component import and render case:

```javascript
// At the top with other imports
import MyComponent from './my-component/MyComponent';

// In the renderComponent() function, add a case:
} else if (componentType === 'my-component') {
  return <MyComponent key={componentKey} {...commonProps} />;
```

### Step 2: Add to ComponentSelector.js

Add your component to the appropriate category:

```javascript
const componentGroups = [
  {
    title: 'Your Category Name',
    components: [
      { id: 'my-component', name: 'My Component', icon: '🎮' },
      // ... other components
    ]
  },
  // ... other categories
];
```

**Tips for choosing a category:**
- Use existing categories when possible (Utilities, D&D 2024 Rules, etc.)
- Create a new category only if your component doesn't fit existing ones
- Choose an emoji icon that represents your component's function

## 🎨 Styling Guidelines

### Color Scheme

Follow the app's dark theme:

```css
/* Backgrounds */
background-color: #1e1e1e;  /* Primary */
background-color: #2a2a2a;  /* Secondary/input */

/* Borders */
border: 2px solid #444;     /* Default */
border-color: #555;         /* Hover */

/* Accent Colors */
color: #6c5ce7;             /* Purple (primary) */
color: #a29bfe;             /* Light purple (headings) */
color: #74b9ff;             /* Blue (secondary actions) */
color: #ff6b6b;             /* Red (danger/monsters) */
color: #00b894;             /* Green (success) */
color: #ffd700;             /* Gold (highlights) */

/* Text */
color: #ffffff;             /* Primary text */
color: #999;                /* Muted text */
color: #666;                /* Placeholder text */
```

### Component Sizing

Design your component to:
- Fill available space (`width: 100%`, `height: 100%`)
- Handle overflow with scrolling
- Scale gracefully in different cell sizes (1x1, 2x2, 3x3, etc.)

```css
.my-component {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.my-component-content {
  flex: 1;
  overflow-y: auto; /* Scrolls when content is too tall */
}
```

### Responsive Design

Consider how your component looks in different cell sizes:

```css
/* For very small cells */
@media (max-width: 400px) {
  .my-component h3 {
    font-size: 12px;
  }
}
```

### Using Shared Styles

Leverage shared CSS classes from `src/components-shared.css`:

```html
<!-- Loading state -->
<div className="loading">Loading data...</div>

<!-- Error message -->
<div className="error-message">Failed to load data</div>

<!-- Empty state -->
<div className="empty-message">No items yet</div>

<!-- Back button -->
<button className="back-button" onClick={handleBack}>Back</button>
```

## 🧪 Testing Your Component

### Manual Testing Checklist

- [ ] Component appears in the Component Selector
- [ ] Component can be added to the grid
- [ ] Drag handle works correctly
- [ ] Component functions as intended
- [ ] State persists when saving/loading screens
- [ ] Component works in different grid sizes (1x1, 2x2, 3x3)
- [ ] Component respects the "Hide Titles" setting (if applicable)
- [ ] No console errors or warnings
- [ ] Component looks good in dark theme
- [ ] Responsive behavior works on smaller screens

### Testing State Persistence

1. Add your component to the grid
2. Interact with it (add data, change settings)
3. Open Settings → Save current screen
4. Refresh the page
5. Open Settings → Load your saved screen
6. Verify all state was restored correctly

### Testing with Import/Export

1. Create a screen with your component
2. Export the screen (Screen Manager → Export)
3. Import the exported file
4. Verify component state is preserved

## 📤 Submitting Your Contribution

### Before Submitting

1. **Test thoroughly** - Follow the testing checklist above
2. **Check for errors** - Run the app and check the browser console
3. **Follow code style** - Match the existing code formatting
4. **Update documentation** - Add any necessary comments
5. **Clean up** - Remove any console.logs or debug code

### Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b add-my-component
   ```

2. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add MyComponent: brief description"
   ```

3. **Push to your fork:**
   ```bash
   git push origin add-my-component
   ```

4. **Open a Pull Request** on GitHub with:
   - Clear title (e.g., "Add MyComponent for tracking XYZ")
   - Description of what your component does
   - Screenshots or GIFs showing it in action
   - Any special setup or dependencies needed

### PR Description Template

```markdown
## Component Name: My Component

### Description
Brief description of what your component does and why it's useful.

### Screenshots
[Add screenshots here]

### Checklist
- [ ] Component follows the template structure
- [ ] State persistence works correctly
- [ ] All required elements included (drag handle, etc.)
- [ ] Registered in GridCell.js and ComponentSelector.js
- [ ] Styling follows guidelines
- [ ] Tested in multiple grid sizes
- [ ] No console errors or warnings
- [ ] Documentation/comments added where needed

### Additional Notes
Any special considerations or future improvements.
```

## 📚 Reference Examples

Check out these existing components for guidance:

- **Simple State**: `Timer` (`src/components/timer/`)
  - Basic state with buttons and display
  - Good for learning the basics

- **List Management**: `Checklist` (`src/components/checklist/`)
  - Array state management
  - Add/remove items

- **Complex State**: `InitiativeTracker` (`src/components/initiative-tracker/`)
  - Multiple state variables
  - Conditional rendering
  - Cross-component communication

- **API Integration**: `Monsters` (`src/components/monsters/`)
  - Fetching external data
  - Search/filter functionality
  - List and detail views

- **Shared Styles**: `Equipment` (`src/components/equipment/`)
  - Uses many shared CSS classes
  - Good example of consistent styling

## ❓ Common Issues

### Component Not Appearing in Selector
- Verify you added it to `ComponentSelector.js`
- Check that the `id` matches the `componentType` in `GridCell.js`
- Ensure the component is exported correctly

### State Not Persisting
- Check that `componentKey` is being used correctly
- Verify state variables are in both load and save effects
- Ensure `isInitialized` is set to `true` after loading
- Check browser console for localStorage errors

### Drag Handle Not Working
- Verify the drag handle has the `draggable` attribute
- Check that `handleHeaderDragStart` and `handleHeaderDragEnd` are implemented
- Ensure `onDragStart` and `onDragEnd` props are passed

### Styling Issues
- Check CSS class names match between JS and CSS files
- Verify you're not using empty CSS rulesets (causes lint errors)
- Test with browser dev tools to debug layout issues

## 💬 Getting Help

- **Template README**: See `src/components/template/README.md` for detailed examples
- **GitHub Issues**: Open an issue for questions or bug reports
- **Pull Requests**: Ask questions in your PR for guidance

## 🙏 Thank You!

Your contributions help make The Gamemaster Screen better for everyone. Whether it's a new component, bug fix, or improvement to existing features, every contribution is appreciated!

Happy coding! 🎲
