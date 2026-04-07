# Spiral Abyss Party Randomizer

Inspired by [Mosurameso (モスラメソ)](https://www.youtube.com/@mosurameso) [all characters roulette Spiral Abyss streams](https://www.youtube.com/playlist?list=PLxn0k-vF3UAPQHVKowc_7XW9dYU5te6Ij), include characters that you have/build to randomly group them for Spiral Abyss.

## Features

### Randomize Mode

- Each group will have 8 random characters
- Use that 8 characters to form a party for first half and second half of floor
- Record the group's star result
- For the last group, if remaining characters exist, it'll fill with random characters from the included character list (excluding remaining characters)
- If Traveler's element is not included, you can freely choose the Traveler's element
- Randomized group results are auto-saved in your local storage, check the results in the Saved Result tab

### Endless Mode

Also inspired by [Mosurameso's Endless Spiral Abyss streams](https://www.youtube.com/watch?v=357wlM7ka2c) — a roguelike-style challenge where you keep climbing floors until you give up.

- Select one character from the character pool as the opening character, then randomly fill the remaining 7 slots
- After clearing a floor, pick one character (excluding the opener) to carry to the next floor
- The remaining 7 characters are randomly selected again, excluding the previous floor's group
- The opener from the current floor cannot be picked as the opener for the next floor
- You start with 3 character rerolls and recover 1 reroll for every 5 floors cleared (no limit)
- Failed floor lineups are preserved in your run history
- Character usage statistics (rarity and element breakdown) are tracked across your run

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS

## Credits

- Character images: [Project Amber](https://gi.yatta.moe/)

## How to Run

```
npm install
npm run dev
```

Or visit the live version at [randomizer-abyss.web.app](https://randomizer-abyss.web.app/)

---

*This website is not affiliated with HoYoverse. Genshin Impact, game content and materials are trademarks and copyrights of HoYoverse.*