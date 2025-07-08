import React from 'react';
// Just use the react-icons directly without a wrapper

// Since we're having trouble with the Icon component wrapper,
// let's modify our approach - we'll export a function that just returns the icon
// This avoids TypeScript issues with the Icon component
export default function renderIcon(IconComponent: any, props: any = {}) {
  return <IconComponent {...props} />;
}
