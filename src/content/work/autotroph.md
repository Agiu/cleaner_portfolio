<!--
  Case study page content. The sidebar (year, title, summary, outcomes, team, advisors,
  hero image/video) lives in src/data/caseStudies.ts — only the right-hand column is here.

  ## Heading        new section + its entry in the sidebar Contents
  > Lead line       the large statement under a heading; a > anywhere later is a small note
  Paragraphs        body copy; **bold**, *italic*, ==highlight==, [links](https://…) and - lists work
  ### Subheading    a smaller heading inside a section
  ![caption](…)     an image, with its alt text as a caption. Consecutive lines = one row
                    (1 full width, 2 side by side); a blank line starts a new row.
  ![caption](… "still clear 16/9")   row options: still = no parallax/crop, clear = no grey
                    placeholder (transparent cut-outs), plus an aspect ratio
  ```stats          a block (masters, stats, button, insights, hmw, quotes, 3d-model, youtube…);
  …                 see src/components/blocks for each one's lines
  ```
  Screenshots are of the site itself, at 1440 × 900 (phones at 390 × 844).
-->

## Statement

> A home for a two-person studio’s first launch, built to sell the game and serve everyone who writes about it.

autotroph games is Jakob Herlitz and Dominic Giardini, two friends in Seattle who self-published their first game, *Haunted Heist*, on October 12, 2026. A launch brings more than players to a studio’s site: press want a fact sheet, creators want to know if they can stream it, and everyone wants the Buy button. I designed and built the site so ==each of those visitors has one obvious place to go==, in a look that matches the game’s giggle-in-horrified-delight tone.

![The home page hero: the crew, the knife pattern, and Buy now branching into the three stores](/work/autotroph/buy-tree.jpg "still 1440/900")

## One page per audience | Players buy, press download, creators ask for keys.

The home page sells; everything dense moves down a level. Each game gets its own page, and the press get a page of their own.

```insights
Players | Buy now sits on the hero and branches into Steam, Humble Bundle and Xsolla, so nobody hunts for a store.
Press | Every game has a kit: release date, short description, one-line hook, studio blurb, a fact sheet and every asset in one download.
Creators | Each game page answers “can I stream it?” up front, then takes key requests straight to the studio’s inbox.
```

![A game page: logo, one-line hook and Buy now over the key art, with a slanted edge into the trailer](/work/autotroph/game-page.jpg "still 1440/900")

![Screenshots, under a section bar that follows the page: Trailer, About the game, Screenshots, Creator keys, Press kit](/work/autotroph/screenshots.jpg "still 1440/900")

![Creator keys: the questions creators ask first, then the request form](/work/autotroph/creator-keys.jpg "still 1440/900")

![The press page, with a kit per game and a direct line to the studio](/work/autotroph/press.jpg "still 1440/900")
![The Haunted Heist kit’s copy and fact sheet](/work/autotroph/fact-sheet.jpg)

## Design language | Navy, crimson and cream, set at a tilt.

Three colours carry the whole site: navy for the dark sections, crimson for anything you can press, cream for reading. Headings are set in Area Extended Black.

Nothing sits quite straight. Section edges slant between navy and cream, and tags, cards and buttons hang at a slight angle, springing level when you hover them, with a little overshoot. The hero’s knives are scattered from a seeded grid, so they land the same way on every visit and never read as a pattern.

![News from the Mansion: the latest posts, pulled from the game’s Steam news hub](/work/autotroph/news.jpg "still 1440/900")

![Our Games: each game as a panel, with its release sticker, its credits and a link to its page](/work/autotroph/games.jpg "still 1440/900")

![About: the founders, behind a crimson “!!!”](/work/autotroph/about.jpg "still 1440/900")

## On a phone | Its own layout, not a shrunken one.

The desktop hero would shrink its text past reading on a phone, so phones get their own stacked stage: the logo, the game and Buy now first, the crew under them. On phones and tablets, the games become swipeable portrait cards.

![The hero on a phone](/work/autotroph/phone-hero.jpg "still 390/844")
![Our Games as swipeable cards](/work/autotroph/phone-games.jpg)

## Handoff | Built so the studio can keep it.

Every word and number on the site lives in one content file, so updating it means editing copy, not components. Anything the studio hadn’t confirmed shows as a dashed “to fill in” box instead of a guess. I also mapped every section to a standard Squarespace block, so the founders can move the site there and run it themselves.

![The footer: a contact form behind “Get in touch”, and links for each game](/work/autotroph/footer.jpg "still 1440/900")
