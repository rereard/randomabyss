# Spiral Abyss Party Randomizer

Inspired by [Mosurameso (モスラメソ)](https://www.youtube.com/@mosurameso) [all characters roulette Spiral Abyss streams](https://www.youtube.com/playlist?list=PLxn0k-vF3UAPQHVKowc_7XW9dYU5te6Ij), include character that you have/build to randomly group it.

- Each group will have 8 random characters
- Use that 8 characters to form a party for first half and second half of floor
- Record the group's star result
- For the last group, if remaining character exists, it'll fill with random character from the included character list (excluding remaining character)
- If Traveler's element not included, you can freely choose the Traveler's element
- Randomized groups results are auto-saved in your local storage, you can check the result's run in Saved Result tab

Credits
- Character images: [Hakush.in](https://gi18.hakush.in/)

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
