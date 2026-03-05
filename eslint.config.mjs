import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...coreWebVitals,
  {
    rules: {
      // Pre-existing patterns: hydration-safe date formatting, effect-based data loading
      // TODO: refactor these patterns when time permits
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
