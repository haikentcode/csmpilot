# Responsive Design Implementation

## Overview
This document outlines the comprehensive responsive design implementation for the SmartCSM frontend application. The design follows a mobile-first approach with three main breakpoints and ensures optimal user experience across all device sizes.

## Breakpoints
- **Mobile**: 320px - 767px (default)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px and above

## Global Responsive Utilities

### Typography Classes
All text elements use responsive typography classes that scale appropriately:

- `.text-responsive-xs`: 0.75rem → 0.875rem → 1rem
- `.text-responsive-sm`: 0.875rem → 1rem → 1.125rem
- `.text-responsive-base`: 1rem → 1.125rem → 1.25rem
- `.text-responsive-lg`: 1.125rem → 1.25rem → 1.5rem
- `.text-responsive-xl`: 1.25rem → 1.5rem → 1.875rem
- `.text-responsive-2xl`: 1.5rem → 1.875rem → 2.25rem
- `.text-responsive-3xl`: 1.875rem → 2.25rem → 3rem

### Spacing Classes
Responsive spacing utilities for consistent layouts:

- `.spacing-responsive-sm`: 0.5rem → 0.75rem → 1rem
- `.spacing-responsive-md`: 1rem → 1.5rem → 2rem
- `.spacing-responsive-lg`: 1.5rem → 2rem → 3rem

### Grid Classes
Responsive grid layouts:

- `.grid-responsive-2`: 1 column → 2 columns → 2 columns
- `.grid-responsive-3`: 1 column → 2 columns → 3 columns
- `.grid-responsive-4`: 2 columns → 3 columns → 4 columns

### Component Classes
- `.card-responsive`: Full-width cards with responsive margins
- `.btn-responsive`: Full-width buttons on mobile, auto-width on larger screens
- `.modal-responsive`: Responsive modal sizing and positioning

## Component-Specific Implementations

### CustomerProfile Component
- **Header**: Flexible layout with responsive button arrangement
- **Customer Info**: Stacked on mobile, side-by-side on tablet+
- **Action Buttons**: Full-width stack on mobile, inline on desktop
- **Cards**: Single column on mobile, multi-column on larger screens

### PreMeetingBriefModal Component
- **Customer Header**: Responsive customer information display
- **Metrics Grid**: 1 column → 2 columns → 3 columns
- **Tab Navigation**: Scrollable on mobile with abbreviated labels
- **Content Areas**: Responsive card layouts with adaptive spacing

### CustomerDetailModal Component
- **Customer Info**: Flexible avatar and details layout
- **Quick Stats**: 2x2 grid on mobile → 1x4 on tablet+
- **Metrics**: Responsive grid with adaptive card sizing
- **Tab Navigation**: Horizontal scroll with responsive labels
- **Action Buttons**: Stacked layout with responsive grouping

### CustomerList Component
- **List Items**: Full-width cards with responsive internal layouts
- **Badges**: Responsive text sizing with hover effects
- **Customer Details**: Adaptive information display

### SimilarCustomers Component
- **Customer Cards**: Responsive grid layout
- **Progress Indicators**: Adaptive sizing and positioning
- **AI Explanation**: Responsive text and icon layouts

## Media Handling
All images, videos, and iframes are responsive by default:
```css
img, video, iframe {
  max-width: 100%;
  height: auto;
}
```

## Table Responsiveness
Tables automatically convert to card-like layouts on mobile devices with data labels for better readability.

## Testing Guidelines
1. Test on actual devices when possible
2. Use browser developer tools to simulate different screen sizes
3. Verify touch targets are at least 44px on mobile
4. Ensure text remains readable at all sizes
5. Check that interactive elements are easily accessible

## Best Practices
- Always use mobile-first approach
- Implement progressive enhancement
- Ensure adequate touch targets (44px minimum)
- Maintain consistent spacing across breakpoints
- Use semantic HTML for better accessibility
- Test with real content, not just placeholder text

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 70+

## Performance Considerations
- CSS is optimized for minimal bundle size
- Responsive images load appropriately sized versions
- Animations are GPU-accelerated where possible
- Critical CSS is inlined for faster initial render