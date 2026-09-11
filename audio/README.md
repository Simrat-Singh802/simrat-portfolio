# audio/

Drop your background track here as **`track.mp3`**.

```
audio/track.mp3
```

That's the path `index.html` points at. Nothing else needs changing.

## This folder is gitignored on purpose

`.gitignore` excludes `audio/*` (keeping only this README). Music files are
almost always copyrighted, and this repo is public — committing one would be
redistributing someone else's work. Keep the file local, or host it somewhere
you have the rights to.

If you later use a track you own outright or one under a permissive licence
(Creative Commons, a royalty-free library, your own recording), you can
commit it by adding an exception:

```gitignore
!audio/track.mp3
```

## Behaviour without a file

The player checks for the file and **removes itself entirely** if it's
missing, logging a note to the console. So a fresh clone of this repo shows
no broken control — nothing to clean up.

## Notes

- Never autoplays. Browsers block it, and unexpected audio on a portfolio is
  a fast way to lose a visitor.
- Starts paused at 35% volume, loops when playing.
- Remembers the visitor's choice in `localStorage`, so pausing it sticks.
- Other formats work too — change the `<source type>` in `index.html` to
  `audio/ogg` or `audio/wav` as needed, or add extra `<source>` elements.
