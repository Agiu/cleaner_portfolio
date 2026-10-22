<!--
  Xbox Arcade. Sidebar details (year, title, summary, outcomes, team, advisors, hero video) live
  in src/data/caseStudies.ts. Set in the v2 layouts: the syntax and layouts are listed at the top
  of src/lib/caseStudyMarkdown.ts. Media not in public/work/xbox is on media.kaelub.com/Xbox.
-->

## Problem

> Playing games on your own has never been easier. Getting your friends to play one together is a whole other story.

For many friend groups, the more noise there is, the more hassle it takes to coordinate and discover their next game. There’s just so much to choose from.

Gamers use plenty of platforms to talk and share games, but one stays constant: Discord. Each server acts as a home base for a friend group — the natural place to keep discovery from fragmenting across a dozen apps — so we met players where they already are.

![](/work/xbox/hero.jpg "1920/962")

## Solution

> Xbox Arcade: discover, decide, and instantly play together, without leaving Discord.

We designed a one-stop experience for game discovery and coordination, delivered within a subscription tier.

![Homepage after subscribing to Discord Nitro + Game Pass](https://media.kaelub.com/Xbox/ex4.jpg "still 2834/1506")

Arcade draws on player data from Xbox and Discord to recommend and assemble mixes of games — internally called Playlists — for a group to play, based on filters and criteria the group sets together.

![Arcade mixing games from your group’s filters: a Playlist](https://media.kaelub.com/Xbox/ex1.jpg "still 2178/670")

More importantly, Arcade removes the hardware barrier by running on cloud gaming, letting a group queue up together instantly.

![Queue up with friends instantly once the wheel picks a game](https://media.kaelub.com/Xbox/ex2.jpg "still 1900/922")

Most of the tools in Arcade exist to help a group decide what to play. The app surfaces what a player’s friends are playing and how they rated a game, and it gives everyone in the group a say in which titles make it to game night.

![Ranking, Spin the Wheel, and social proof, to make coordinating and deciding easier](https://media.kaelub.com/Xbox/ex3.jpg "still 3536/2090")

==As a byproduct, we created a new way to deliver games: every instantly playable Xbox game, under one price.==

```youtube
oO-0QA1BzfQ | unmuted
```

## Research

> We set out to design a storefront. Players told us that was the wrong problem.

When we started, a corporate connection to storefronts and publishing within Xbox swayed us toward designing for a storefront, and much of our early research was through that lens.

### 500 Reddit posts pointed to one recurring feeling: Xbox ships at players, not with them.

Reddit is a great place to find player sentiment on a topic, so I built a parsing tool, which Sauhee used to collect nearly 500 responses from Xbox communities about storefronts.

```quotes
I’ve also found the current Xbox site really hard to use. I used to like the older layout where I could clearly find “new releases” or filter by genre and demos. | u/Free_Care1189
I’d like to be able to filter by full games, game bundles, and DLCs. It’s ridiculous that I have to keep scrolling past 70 different packs for the Sims 4 every time I’m looking at what’s on sale. | u/therealbigz5
At least it’s sort of working. I loaded an indie game on the store and it asked for which edition of Forza and then Far Cry. | u/CriticalGeeksP
It literally looks like a site I should be using to file my taxes, not buying video games. | u/avardotoss
The new games page is consistently outdated and doesn’t actually show all the new games on Xbox. This wasn’t always the case. | u/Blue_Sheepz
It’s not as bad as the PlayStation website at least. | u/MasterArCtik
```

From the quotes, player alienation is a recurring problem around Xbox: many initiatives ship without gathering player feedback, analyzing it, or acting on it at all. We treated that as the core problem to design against.

==So we made players our de facto stakeholder.==

Because their needs came first, we had to truly understand their sentiment, and the only way to do that was to talk to them in person, in their own environment.

```button
View All Scraped Data | https://docs.google.com/spreadsheets/d/1simp5TxkqfrUDZ8C1UFESbT_yu6HPKMbkgEsDbNFIlg/edit?usp=sharing
```

### We brought the questions to the players, at two conventions.

```carousel
https://media.kaelub.com/Xbox/Carousel1.jpeg | Us at Emerald City Comic Con, dressed up as Sims. The costumes helped draw people in to interview.
https://media.kaelub.com/Xbox/Carousel2.jpg | Conducting on-the-spot interviews with Xbox players.
https://media.kaelub.com/Xbox/Carousel3.jpg | By the end of the day, our sentiment sticky boards were full.
```

Comic and anime conventions are a fantastic place for guerrilla research:

- A large, diverse sample of players, Xbox players among them
- Anime and comic fans overlap heavily with gaming fan bases
- There wasn’t a gaming convention nearby, so we chose adjacent ones

We wanted to understand how players feel about gaming storefronts — emotionally, philosophically, and what they wish were better — and to see how they’d reimagine one under different lenses: a storefront that feels like home, like a convention, or one that lets you wander.

### Building up our player sentiment

```stats
220+ | Affinity sticky notes from both conventions
20 | Interviews at Emerald City Comic Con
28 | Co-creation interviews at Sakura Con
```

![Sentiment questions we asked gamers about every platform, Xbox included](/work/xbox/sentiment.jpg "still 1702/924")

At our first on-site research event, we asked a general audience of gamers:

- What makes you feel like you belong to an online gaming community?
- What is the PC vs. console experience?
- What makes an online game store experience meaningful, or not?
- Describe this platform in one word: PlayStation, Xbox, Steam, and Nintendo.

To keep it Xbox-oriented, we asked everyone who added to our sentiment chart whether they played on Xbox. If they did, we gave them a survey with more specific questions about Xbox.

```button
View Xbox-Specific Sentiment Data | https://docs.google.com/spreadsheets/d/1w4cQPsoy7bV83_Yzb-X72d2eDHJX2J5WAPhrlZr1Rbo/edit?usp=sharing
```

### Co-designing with gamers at Sakura Con

```carousel
https://media.kaelub.com/Xbox/Carousel4.jpg | Asking people to design their ideal storefront through different lenses at Sakura Con.
https://media.kaelub.com/Xbox/Carousel5.jpg | One storefront reimagined as a player progression map.
https://media.kaelub.com/Xbox/Carousel6.jpg | Another as a cozy bookstore to sift through.
```

Through affinity mapping and co-creation, we found that while many saw storefronts as corporate and transactional, they enjoyed reworking a storefront’s motive: some as a player progression map, others as a cozy bookstore to sift through and discover something new.

### What both conventions told us

```insights
Gamers view Xbox through rose-tinted glasses | Sentiment was split: “nostalgic,” “toxic,” “dying,” and “bustling” all showed up in our sentiment form.
Game discovery is social | Players want to see their friends in the storefront: buying a game, rating a game, and so on.
Other apps fill the social gap | Players use many other platforms to decide what to play next with their friends.
Storefronts are generally disliked | Players would rather not interact with a storefront at all.
```

At this point we had a few ideas for our direction, but [Genevieve Conley Gambill](https://www.linkedin.com/in/genevieveconley/), Director of Xbox Research, suggested Game Pass: a large part of Xbox’s business, and where most players discover new games. To validate what we heard at the conventions on a broader scale, we ran a survey on how multiplayer friend groups discover games and use Game Pass.

## Sharpening the Focus

> A Game Pass survey surfaced the real gap: great social features nobody can find.

### What the Game Pass survey found

```stats
42 | Total responses
34 | Current or past Game Pass users
76.4% | Of those, subscribed for over two years
```

Play styles vary, but social gaming dominates: 62.8% play both solo and multiplayer, 23.3% play purely multiplayer, and only 14% play purely solo.

The Game Pass library’s value goes unrealized because it’s hard to search. Players usually discover games outside Xbox, mostly on Steam, then come back only to check whether a game is on Game Pass.

==People don’t know what Game Pass can do.==

Crucial social features like co-op filters go largely undiscovered, and group chats sit hidden across inconsistent console and web interfaces, so the platform delivers less than it’s capable of.

### Player interviews

We interviewed 12 Xbox gamers and could sort them into eight kinds of player. Twelve is a small number, but the categories reached many corners and niches of the Xbox community.

```personas
P1 | Veteran Gamer | Past Game Pass, Cross-console, Solo + co-op | Steam majority, Small group, Frequent co-op
P2 | O.G. Xbox Loyalist | Variety explorer, Price motivated, Solo + co-op | Large group (10+ years), Xbox platforms
P3 | Achievement Hunter | Past Game Pass, Cross-console, Solo + co-op | Steam majority, Small group, Frequent co-op
P4 | Casual Social Gamer | Fast-paced, Solo + multiplayer, Variety gamer | 5+ friends and family, Routine-based
P5 | Casual Social Gamer | PC solo player, Relaxation and routine
P6 | Casual Social Gamer (Passive) | PC focused, Solo + multiplayer | Steam majority, Small group, Co-op focused
P7 | Scout | PC daily player, Group discoverer | Daily with friends, Long-time group, Game Pass Ultimate
P8 | Night Shift Gamer | PC 1–2× a week, Schedule limited, Solo + co-op | Hard to align schedules, Long-time gamer, Game Pass Ultimate
```

==Co-op and group players are left untethered.==

The interviews gave us the qualitative proof: despite its marketing, Xbox neglects the co-op and group gaming community, and is treated as a last resort when a group decides what to play.

## What the Research Told Us

> Xbox shows up last in the journey, hides its best features, and ignores how little time friends have.

```insight-toggle
## Business insights
Xbox shows up late in discovery | Gamers discover and weigh games through friends, Discord, social media, creators, Steam, and Reddit, then return to Xbox to check availability.
Xbox has the features, but hides them | Players overlook existing Xbox features because they’re hard to find or reach during regular play.
Friends have little time | As gaming competes with life, groups choose games that fit their schedules, interests, and access.
## Player insights
Storefronts feel transactional | Players described most storefronts as corporate and purely transactional.
Trust comes from friends | Players would rather read a friend’s take on a game than a stranger’s review.
Discovery is a group activity | Players prefer finding games with their friends rather than alone.
```

```hmw
How might we design a nook for a group of gamers that allows game discovery and coordination without it feeling transactional?
```

## Ideation

> Everyone had a different fix, so we prototyped four in parallel to see what stuck.

![](https://media.kaelub.com/Xbox/hackathon.jpg "still 4032/3024")

Everyone on the team had a different vision for addressing these insights, so we took a few days to build wireframes and prototypes, share them, and decide our next steps.

### I built a ranking tool that turns “what should we play” into a few-minute group decision.

![You and your friends add games to the queue before time runs out](https://media.kaelub.com/Xbox/Wireframe1.JPG "still 1371/704")

Clarisse and I thought building within Discord was a good option, since gamers already use it to decide what to play next. I wanted a small tool to help with that final decision, and to have some fun doing it.

Friends join a Discord call, open the games tab, and queue up games from their own Xbox or Game Pass libraries. The group then has a few minutes to vote, with the time limit set by whoever started the round.

![Social nudges and tags to help people choose](https://media.kaelub.com/Xbox/Wireframe2.JPG "still 1692/566")

It’s meant to start conversation and a little controversy, which is always great for gaming. Once a game is picked, the group either queues straight in or completes a group buy: gifting is common in gamer communities, so no one in the call is left out.

### A high-fidelity prototype of the ranking system

```video
https://media.kaelub.com/Xbox/RankingPrototype.mp4 | The ranking tool in a simulated Discord call
```

To show it in action, I prototyped it with simulated friends in a fake Discord app built in Electron, using code and Claude to work out the simulated gamers’ logic. It opens for everyone in the call at once, lets friends add their own games and rate each other’s picks, and shows who voted for what, to spark a conversation about why.

This iteration also started an idea of mine: hover videos as the main persuasion tool, as Netflix does to let you sit on a title before deciding. Roblox and Steam adopted the same interaction a few weeks after I discussed it with our advisor [John Snavely](https://www.linkedin.com/in/john-snavely-7259203/), so maybe I was on the right track.

### Group iterations

```carousel
https://media.kaelub.com/Xbox/sauhee1.png | Sauhee · Discovery | A discovery page for Xbox games that matches you and your friends’ interests.
https://media.kaelub.com/Xbox/sauhee2.png | Sauhee · Buy | Buying straight from Discord.
https://media.kaelub.com/Xbox/meera.png | Meera · Information page | Games your friends enjoy, with social proof to nudge you to buy or wishlist, and a greenlight system showing who can run what.
https://media.kaelub.com/Xbox/clarisse.png | Clarisse · Storefront | An Xbox storefront within Discord.
https://media.kaelub.com/Xbox/caleb.png | Caleb · Ranking system | A ranking system that lets friends discuss and see who can run a game, or who has it installed at all.
```

### I argued we should stop guessing the perfect game and design for the arguments friends actually have.

To unify the product, we had to redefine our core value. I insisted gamers don’t actually struggle to discover games.

==They struggle to get five people with different hardware, budgets, and tastes into the same lobby.==

## Direction

> Cloud gaming let us drop the storefront entirely: no buying, no tiers, just play.

Instead of trying to algorithmically guess the perfect game, we leaned into how friends actually operate, and built tools for the exact conversations a group needs to get aligned and playing together, all in one place.

After much deliberation we cut the storefront. Rather than an Xbox store on Discord, we removed ourselves from the transaction and started the product in discovery, leading into coordination.

```decision
No buying, no tiers, just play.
```

### Cloud gaming

![Inspiration for the art direction: an old Xbox feel with a modern twist](https://media.kaelub.com/Xbox/artdirection.JPG "still 2285/1074")

With cloud gaming there’s no buying games for each other, and no subscription tiers giving players uneven access; it would come with the Discord and Xbox partnership tier. If the experience is cloud-based and paid ahead of time, discovering games needs no transaction at all.

![Our new front page, in my art direction](https://media.kaelub.com/Xbox/new_frontpage.JPG "still 1539/863")

We built a home page, a library of games included in the tier, and a Mixes page to curate games for you and your friends in the call, with info cards designed to catch a player’s eye and draw them into a game.

### Creating a mix of games

![The Mixes page](https://media.kaelub.com/Xbox/ending/contentdetail1.JPG "still 1241/1045")

Clarisse thought of a system like a Spotify Jam: people in a party get games recommended from a theme, criteria, and their play history, and can rank games per mix, much like my ranking tool without the timer. It’s all about shortening the distance between discovery and play, without the hurdle of fetching your wallet from across the room.

### Spinning the wheel, to make a quick decision

![The first Spin the Wheel, and where it lived](https://media.kaelub.com/Xbox/ending/wheel1.JPG "still 1415/986")

Spin the Wheel started as a fun idea I raised for quick decisions and an ending to our product’s story. I prototyped it to play around, and it worked well for picking a game on a whim. When the wheel stops, everyone in the party is alerted and can queue up together; if not everyone joins, you can spin again or play without them.

Sometimes design has a bit of spontaneity, and that’s okay.

### Social proofing

![Friend reviews made prominent in the content details page](https://media.kaelub.com/Xbox/ending/socialproof.JPG "still 1276/1118")

I brought in social proofing so players can see what their friends have played, recommend, and think, and my teammates carried it into the home and mix pages. Friends nudge each other when deciding what to play anyway, and several interviewees said they’d trust a friend’s opinion over a stranger’s, so we made friend reviews much more prominent.

## Gameplay Previews

> Higher conversion through gameplay previews: show the game, not a wall of text.

There were three routes for what a game card shows:

- Minimalist: only the game itself.
- The game, with a few tags about how it plays.
- Maximalist: every piece of information possible.

I started with gameplay footage and tags. Hovering a card plays a small preview of the game, like a trailer on Netflix, instead of a wall of text. Seeing the gameplay answers more questions than it raises.

```video
https://media.kaelub.com/Xbox/ending/Desktop%202026-09-08%202-00-06%20AM.mp4 | The first previews, in portrait
```

Portrait video made no sense, since games on a desktop are 16:9, so I switched to landscape, which also left room for buttons to add a game to a Playlist or share it with friends.

```video
https://media.kaelub.com/Xbox/ending/Desktop%202026-09-08%202-02-43%20AM.mp4 | Landscape previews, with Playlist and share buttons
```

## Testing

> Watching friend groups play showed us exactly where discovery and decision collided.

### Testing in numbers

```stats
~16 | People tested, ideally already friends
20+ | Changes to the UI and concepts
```

### Players said one thing about the previews, but did another.

We showed three designs: maximalist, in between, and simple. On every call people said they preferred the maximalist one for its fun facts, but when they hovered the simpler cards they were mesmerized by the footage, and those were the ones they clicked.

### Watching friend groups use the prototype

```video
https://media.kaelub.com/Xbox/multiview.mp4 | Every player’s screen at once, through a realtime database
```

Sauhee’s idea: hooking a Firebase realtime database to the prototype let us watch every player’s screen at once, catching bugs and reactions without anyone sharing their screen on Discord.

```compare
https://media.kaelub.com/Xbox/ending/homepage1.JPG | The home page before testing | Before
https://media.kaelub.com/Xbox/ending/homepage2.JPG | The home page after testing | After
```

The home page changed drastically: some found the spacing too much, and others were confused by a subscription button shown to players who were already subscribed. We moved mixes, now Playlists, into their own tab so discovery comes before decision.

### Players wanted the wheel everywhere, so it moved into the navbar.

![The wheel button, moved into the navbar](https://media.kaelub.com/Xbox/ending/wheel.JPG "still 1354/95")

Players loved spinning the wheel, and wanted to even when they weren’t on a mix page. I thought of the Amazon shopping cart: our app isn’t transactional, but a familiar storefront metaphor keeps it easy to understand. So the wheel moved into the navbar, reachable anytime, and the same testers preferred it.

![The last iteration of the wheel](https://media.kaelub.com/Xbox/ending/wheel3.JPG "still 1422/806")

Much of our naming was only ever temporary, so we gave the app a simpler language for players meeting it for the first time.

```renames
Xbox Party -> Xbox Arcade
Mix -> Playlist
Add to wishlist -> Add to Playlist
Wishlist -> Playlist
```

```button
Test Our Prototype | https://xboxarcade.netlify.app/
```

## Reflection

> What I’d carry into the next one.

This is one of the largest projects I’ve worked on, and Xbox’s head of design and director of research praised how we took our research in a human-oriented direction and carried it into the designs.

I now think of it less as a coordination tool and more as a future for cloud gaming. Much like Roblox, where cheap games are treated as experiences, what value would a tool like this give games in the future? Games are expensive, so it could help there; I’d have enjoyed thinking through the business model it could serve.

We kept it grounded in what players told us, steering clear of unneeded AI since gamers are split on it. Most of this project was made without AI; we only used it to help code the prototype.

![Rewriting our video the day of the shoot: a good picture of how those last few weeks felt](https://media.kaelub.com/Xbox/frustration.jpg "still 4032/3024")
