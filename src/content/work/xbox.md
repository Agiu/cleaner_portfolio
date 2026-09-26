<!--
  Case study page content. The sidebar (year, title, summary, outcomes, team, advisors,
  hero image/video) lives in src/data/caseStudies.ts — only the right-hand column is here.

  ## Heading        new section + its entry in the sidebar Contents
  > Lead line       the large statement under a heading
  Paragraphs        body copy; **bold**, *italic*, [links](https://…) and - lists work
  ### Subheading    a smaller heading inside a section
  ![alt](/work/…)   an image. Consecutive lines = one row (1 full width, 2 side by side);
                    a blank line between images starts a new row. Images can go anywhere
                    in a section, text continues below them.
  ![alt](/work/… "still 16/9")   row options: still = no parallax/crop, plus an aspect ratio
-->

## Problem

> Playing games on your own has never been easier. Getting your friends to play one together is a whole other story.

For many friend groups, the more noise there is, the more hassle it takes to coordinate and discover their next game. There’s just so much to choose from.

Gamers use plenty of platforms to talk and share games, but one stays constant: Discord. Each server acts as a home base for a friend group — the natural place to keep discovery from fragmenting across a dozen apps — so we met players where they already are.

![](/work/xbox/discord.jpg)

## Solution

> Xbox Arcade: discover, decide, and instantly play together, without leaving Discord.

A one-stop experience for game discovery and coordination, delivered within a subscription tier. Arcade draws on player data from Xbox and Discord to recommend and assemble mixes of games — Playlists — based on filters and criteria the group sets together.

More importantly, Arcade removes the hardware barrier by running on cloud gaming, so a group can queue up together instantly. Ranking, Spin the Wheel, and social proof give everyone a say in what makes it to game night.

![](/work/xbox/homepage.jpg)
![](/work/xbox/spin-wheel.jpg)

## Research

> We set out to design a storefront. Players told us that was the wrong problem.

I built a parsing tool that Sauhee used to collect nearly 500 Reddit posts from Xbox communities. One feeling kept recurring: Xbox ships at players, not with them — so we made players our de facto stakeholder.

Then we took the questions to players in person: 220+ sticky notes and 20 interviews at Emerald City Comic Con, plus 28 co-creation interviews at Sakura Con, where players reimagined a storefront as a progression map or a cozy bookstore to sift through.

![](/work/xbox/convention-team.jpg)
![](/work/xbox/sticky-notes.jpg)

## Sharpening the Focus

> A Game Pass survey surfaced the real gap: great social features nobody can find.

Of 42 responses, 34 were current or past Game Pass users, and 76.4% of those had been subscribed for over two years. Social play dominates: 62.8% play both solo and multiplayer, and 23.3% play purely multiplayer.

Players discover games elsewhere — Steam, Discord, friends — then return to Xbox only to check availability. Co-op filters and group chats exist, but go largely undiscovered. Twelve player interviews confirmed it: co-op and group players are left untethered.

![](/work/xbox/sentiment.jpg)

## Ideation

> Everyone had a different fix, so we prototyped four in parallel to see what stuck.

I built a ranking tool inside a Discord call: friends queue games from their Xbox or Game Pass libraries and get a few minutes to vote, with everyone’s picks visible to spark a little friendly controversy. I prototyped it with simulated friends in a fake Discord built on Electron.

The takeaway I argued for: gamers don’t struggle to discover games — they struggle to get five people with different hardware, budgets, and tastes into the same lobby at the same time.

![](/work/xbox/whiteboard.jpg)
![](/work/xbox/wireframe.jpg)

## Direction

> Cloud gaming let us drop the storefront entirely: no buying, no tiers, just play.

With cloud gaming there’s no buying games for each other and no subscription tiers giving players uneven access. That let us remove the transactional experience and start the product in discovery, leading into coordination.

I set the art direction — an old Xbox feel with a modern twist — across a home page, a library of compatible games, and a Mixes page where a party curates and ranks games together, with Spin the Wheel to settle it on a whim.

![](/work/xbox/art-direction.jpg)

## Testing

> Watching friend groups play showed us exactly where discovery and decision collided.

We tested with around 16 people — ideally already friends — and made 20+ changes. A realtime database let us watch every player’s screen at once instead of juggling screen shares.

Players said they preferred the maximalist game previews, but lingered on, and clicked, the simple ones with gameplay footage. Mixes became Playlists in their own tab so discovery comes first, and the wheel moved into the navbar because everyone wanted to spin it everywhere.

![](/work/xbox/social-proof.jpg)
![](/work/xbox/wheel-final.jpg)

## Reflection

> What I’d carry into the next one.

This is one of the largest projects I’ve worked on, and Xbox’s head of design and director of research praised how we took our research in a human-oriented direction and carried it into the designs.

I now see it less as a coordination tool and more as a future for cloud gaming services. We kept it grounded in what players told us — steering clear of unneeded AI, since gamers are split on it — and used AI only to help code the prototype.

![](/work/xbox/last-weeks.jpg)
