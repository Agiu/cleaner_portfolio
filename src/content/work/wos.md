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
  ```youtube        a YouTube video row; the fence holds just the video id

  The prototype is a prebuilt app in public/who: the story at /who/, the map at /who/explore/.
-->

## Overview

> A data visualizer that traces who owns South Lake Union, block by block, over time.

Who Owns Seattle presents a timeline of ownership across downtown Seattle. It reveals the economic patterns, companies, and notable developers that dictate the landscape of downtown, using publicly accessible data from King County.

It’s now a working prototype: [read the story](/who/) or [explore the map](/who/explore/) (the map needs a desktop browser).

![Who Owns Seattle ownership map](https://media.kaelub.com/WOS/1.png "still 3302/1892")

![South Lake Union parcels colored by owner](https://media.kaelub.com/WOS/2.png "still 3298/1896")
![Ownership timeline](https://media.kaelub.com/WOS/3.png "still")

## History

> Pioneer Square and South Lake Union sit a mile apart and look like they’re from different centuries.

An urban studies interest of mine, sorry. Seattle’s downtown has seen a dramatic price increase over the last few decades; what was once a shipyard and supply-chain dock is now one of the most important tech centers on Earth.

Visiting downtown, I was struck by the architectural differences between two neighborhoods. Pioneer Square still exudes old Seattle: exposed brick, not ADA compliant or earthquake proof, but full of character. South Lake Union pushes a corporate, sleek narrative meant for tech workers, salarymen, and wealthy individuals. They sit in the same economic bubble and looked roughly the same 50–70 years ago.

![Pioneer Square and South Lake Union](https://media.kaelub.com/WOS/4.jpg)

## How We Got Here

> South Lake Union was supposed to become Seattle’s Central Park. When the vote failed, Paul Allen turned it into real estate instead.

In the 90s, with the help of Microsoft co-founder Paul Allen, South Lake Union was meant to become something like New York’s Central Park through an initiative called the Seattle Commons.

![The Seattle Commons proposal (source: historylink.org/File/8252)](https://media.kaelub.com/WOS/5.png "still 2106/1846")

As much as I would have enjoyed that, the measure didn’t pass, so Allen turned the land into something profitable through his company, [Vulcan Real Estate](https://vulcanrealestate.com/). Over the years Vulcan has grown his estate into a multibillion-dollar portfolio by developing land that was originally meant to be a park for Seattleites. So what did Vulcan do with all that land?

## The Thesis

> A handful of developers, not market demand, decide who gets to live downtown.

I wanted to track how South Lake Union has changed hands over time, and to use AI to speed the project up, so I worked with Claude to find data and build an app that tells a story through it.

Downtown Seattle has many owners, but the richest dictate who gets to live there through their development decisions. When a growing economy needs housing for its workers, developers build more expensive housing to cover rising land costs and turn a profit.

Lately the downtown market has been declining, from heavy apartment development and office workers moving to remote work. Remote work is great for convenience and workers’ rights, but with most workers in the suburbs, downtown foot traffic and its economic benefits for businesses drop, as seen during COVID. In short, large corporations can easily dictate a geographic economy, shaping the look of a city and the experience of the people strolling through it.

## Building It

> King County’s ownership data is public but paywalled, so I built a scraper to get it anyway.

### A note on the data

This is a personal project, and I won’t publish the full codebase because of how fragile the collected data is. As a UW student not doing sponsored research, I don’t have access to datasets with protected fields like owner names, which this project needs. In the future I could work with King County directly, but I wanted to build a working prototype first.

### Parsing King County’s parcel viewer

I built a Python and JavaScript scraper that visits a parcel in the King County parcel viewer and returns the HTML tables on that page. It’s dirty, but it gets the job done. I then worked with Claude to automate collection: mapping all of South Lake Union would have been two days of work; it took 30 minutes.

![Code snippet that parses the King County parcel viewer](https://media.kaelub.com/WOS/7.png "still 1468/1586")

At first I let the tool decide what counted as South Lake Union, but I got better results with more control. King County identifies every property by parcel number rather than address, which makes a great unique ID for a database, and parcel numbers can be queried directly in the viewer.

![Some of the parcel numbers used for the initial collection](https://media.kaelub.com/WOS/6.png "still 1920/1350")

The scraper and automation are on [GitHub](https://github.com/Kaelubagu/King-County-Data-Parser).

## The Prototype

> A story first, then a map you can scrub through decades of ownership.

After cleaning up the data and seeing how prolific Paul Allen was with his property, I hand-designed a visualizer around the new dataset. The [story site](/who/) walks through how South Lake Union got here. The [explorer](/who/explore/) maps every parcel by owner, with a timeline to scrub through the years and a panel showing each parcel’s sales history, linked back to its King County Assessor record. Here’s an earlier demo of the visualizer:

```youtube
XTSZty1by-c
```
