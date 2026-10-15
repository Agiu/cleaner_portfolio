<!--
  Case study page content. The sidebar (year, title, summary, outcomes, team, advisors,
  hero image/video) lives in src/data/caseStudies.ts — only the right-hand column is here.

  ## Heading        new section + its entry in the sidebar Contents
  > Lead line       the large statement under a heading; a > anywhere later is a small note
  Paragraphs        body copy; **bold**, *italic*, ==highlight==, [links](https://…) and - lists work
  ### Subheading    a smaller heading inside a section
  ![alt](/work/…)   an image. Consecutive lines = one row (1 full width, 2 side by side);
                    a blank line between images starts a new row. Images can go anywhere
                    in a section, text continues below them.
  ![alt](/work/… "still 16/9")   row options: still = no parallax/crop, plus an aspect ratio
  ```flow           an interactive prototype (stream, youtube, errorbars, flow, variants, submenu,
  …                 logbook, logbook-compare); see src/components/blocks for each one's lines
  ```
  > Note            on the line straight after the fence (no blank line): sits beside the
                    prototype (submenu and logbook have room); a blank line puts it below
-->

## Context

> ForeFlight builds the electronic flight bag most U.S. general aviation pilots fly with.

Flight planning, weather briefings, charts, and a digital logbook that has to hold up the same way a paper one does. I joined the Debriefing team for the summer as a software engineer intern, working alongside product design.

## Error Bar

> A mini project first: a more nuanced error bar, for QA testers and for pilots.

The ForeFlight debriefing system would grade a pilot based on the flight data taken on the app and the hardware ForeFlight creates.

==To make sure a pilot receives a grade in the first place and that all flight data is collected, ForeFlight uses a system called Track Logs to keep all their flights organized.==

The data that Track Logs collects:

```stream
Telemetry — skew, speed (in knots), fuel, etc.
Flight paths
Distance
Airport codes
Dates
Total times
Each location the plane has landed and disembarked from
Coordinates
```

There is much more; if you’d like to see all the data it tracks, [click here.](https://support.foreflight.com/hc/en-us/articles/205696557-What-kind-of-flight-data-is-recorded-in-a-track-log-CSV-file)

## The Problem

However, when we wanted to run a QA test at ForeFlight, or when a legitimate error showed up on a customer’s dashboard, the existing design wouldn’t tell you exactly what the issue was or even if it was an error. ==I set out to design and implement a few variants of this error bar for ForeFlight internal testing as well as for consumer purposes.==

> One note with the demo below: the error code will be printed out in the console within the inspect element viewer for QA testing.

```youtube
NB2-N-zX2jw | unmute
```

> Excuse my bad hair in this video. I moved directly from Australia to the United States and hadn’t had time to fix myself up. Perfect for a software engineering job though!

```errorbars
caption: Error bar variants as seen in the demo video above
```

## Error Bar Outcome

> Small in scope, but the change people had been asking for.

==Since this was an internal improvement that people really wanted, many of the engineers and QA testers were praising this change, despite its size in the grand scheme of software at ForeFlight. This was my first collaboration with the people in product design; lots of great feedback came from these meetings I set up.==

## Track Logs

> The ending project: linking Track Logs to logbooks on the web.

While ForeFlight’s iPad app allowed mid-flight pilots to seamlessly link their Track Logs to their logbooks, the web application lacked this capability.

Pilots need to connect these systems to automate their flight time calculations, attach visual debriefing data to their permanent records, and consolidate fragmented tracking data — like a multi-leg cross-country trip or an interrupted recording — into a single, clean logbook entry.

### Automating Accuracy

Track logs capture exact telemetry — takeoff time, landing time, route, and distance. By linking a log directly to a logbook entry, pilots eliminate manual data entry, reduce the math required to calculate exact flight hours, and prevent human error.

### Consolidating Fragmented Journeys

A pilot’s day might consist of multiple short hops (e.g., flying from airport A to B, grabbing lunch, then flying to C), or a single flight might get split into multiple Track Logs if the iPad overheats or the app is accidentally paused. Linking multiple Track Logs into one logbook entry allows the pilot to accurately record the entire day’s journey or fix fragmented data without creating cluttered, redundant logbook entries.

### Post-Flight Debriefing

A logbook is a training tool. By attaching the track log, a pilot (or their flight instructor) can look back at an entry months later and visually review the exact path flown, including practice maneuvers, holding patterns, and approach vectors.

### Proof of Experience

Aviation is highly regulated. Having GPS-backed telemetry explicitly linked to a logbook entry provides undisputed proof of the flight for insurance purposes, FAA currency requirements, or check-ride preparations.

## The Flow

> Design-wise, it’s very simple.

However, underneath the design I need to code a way to connect all the telemetry data and mutate or create new data within the logbook entry. That’s the difficult part.

```flow
step: Use the kebab menu | On any track log row in the web app.
step: Press “Link Logbook” | One press, no matching screen, no form.
step: No entry yet? One is made | Created empty, then filled for you.
step: Telemetry crosses over | Every recorded field lands on its row.
step: Legs consolidate | Two or more Track Logs, one clean entry.

leg: KHYI → KAUS | 14 Jun 2024 · 0.9 hr
leg: KAUS → KSAT | 14 Jun 2024 · 0.7 hr

field: Telemetry | 118 kt · 12.4 gal · skew ±3° | 1
field: Flight paths | 2 legs · 1,412 fixes | 1
field: Distance | 96.4 nm | 1
field: Airport codes | KHYI · KAUS · KSAT | 2
field: Dates | 14 Jun 2024 | 1
field: Landings & departures | 3 stops · 2 landings | 2
field: Coordinates | 29.89°N 97.86°W | 2
field: Total times | 1.6 hr | both

entry: Cross-country — KHYI to KSAT
```

## Variants

> Seven passes at one modal.

The flow only works if a pilot presses the thing in the first place, so the modal itself went through seven passes. These variants were created to see what IA would work best at first viewing. It’s a modal, so it shouldn’t have too much cognitive load.

```variants
title: Logbook Link
route: 68ME → 68ME
blurb: You have a logbook available for this track log. Link it to gain more insight about your flight.
action: Link Track Log
confirm: Redirecting you to logbook...

variant: Route and a button | narrow, route, action | The barest version. It tells you the flight and offers the link, and assumes you already know what a logbook link is — which most pilots on the web app didn’t.
variant: The sentence added | narrow, route, blurb, action | One line of copy explaining what linking buys you. The card grows, and the button stops being the only thing to read.
variant: The flight, drawn | plane, route, blurb, action | Wider frame, and the aircraft above the route — so the prompt reads as being about a flight before you’ve read a word of it.
variant: A rule under the route | plane, route, rule, blurb, action | The same card with a hairline between the flight and the copy about the flight. Two things instead of one paragraph.
variant: Both halves of the link | plane, book, route, blurb, action | Plane plus book: the two records being joined, stated as the icon pair rather than in the sentence underneath.
variant: Both halves, ruled | plane, book, route, rule, blurb, action | The icon pair and the rule together — the most furnished pass, and the one that says the most before it’s read.
variant: What the press leads to | confirm | Every variant resolves here: a confirmation and a hand-off to the logbook, so the press has an end rather than a dismissal.
```

## Submenu

> Adding a submenu and a story.

Every variant above assumed there was exactly one track log to link, but a pilot’s day is rarely one flight, and “Link Track Log” pressed against whichever entry happened to be open might accidentally pick the wrong one.

So the button the variants ended on grew a submenu: press it, and instead of acting immediately it opens a small picker; recent Track Logs first, one recommended pick underneath it (the flight that actually matches this entry).

```submenu
title: Logbook Link
route: 68ME → 68ME
blurb: You have a logbook available for this track log. Link it to gain more insight about your flight.
action: Link Track Log
confirm: Redirecting you to logbook...
recent-label: Recent Track Logs
recommended-label: Recommended

recent: KHYI → KAUS
recent: KAUS → KSAT
recent: 68ME → 68ME
recent: KSAT → KHYI
recent: KAUS → KAUS
recent: KHYI → KHYI

recommended: 68ME → 68ME
```
> Many issues with this: cannot create a new logbook entry, nor can you decipher if a certain airport code is the one you want (you need more information to determine that). It’s also unclear if you’re selecting a track log to link to the logbook or linking a logbook to a specific track log — which is incorrect from the user flow.

## Final Design

> Reversing the flow: start from the track log you clicked.

==So what I did differently with the final designs is reverse the process. Instead of getting confused about if you’re linking a track log to a logbook or the other way around, you will instead link the track log you have clicked before even entering the modal.==

```logbook
title: Add to Logbook
heading: Select a Logbook entry
blurb: You have a logbook available for this track log. Link it to gain more insight about your flight.
group: Recent Entries
recommended-group: Recommended Entries
connected-note: Linked
secondary: Create New Entry
confirm: Redirecting you to logbook...
confirm-new: New logbook entry created
new-entry: 68ME → 68ME | N1327T (PA32) | Today | 0.8 Total

entry: KAUS to KDAL | N1327T (PA32) | Dec 7, 2023 | 1.1 Total
entry: KHYI to KAUS | N1327T (PA32) | Jun 14, 2024 | 0.9 Total | linked
entry: KAUS to KSAT | N1327T (PA32) | Jun 14, 2024 | 0.7 Total | linked
entry: KSAT to KHYI | N4592B (C172) | Jun 12, 2024 | 1.4 Total
entry: KDAL to KAUS | N1327T (PA32) | Dec 6, 2023 | 1.2 Total
entry: KHYI to KHYI | N4592B (C172) | Nov 28, 2023 | 0.6 Total

recommended: KAUS to KHYI | N1327T (PA32) | Jun 14, 2024 | 1.6 Total
recommended: KSAT to KAUS | N4592B (C172) | Jun 20, 2024 | 0.8 Total
```

### Making the interaction cleaner

I got ahead of myself on purpose. Before I even considered redoing the interaction design, there was another design of this modal that included checkboxes and more buttons!

```logbook-compare
title: Add to Logbook
heading: Select a Logbook entry
blurb: You have a logbook available for this track log. Link it to gain more insight about your flight.
group: Recent Entries
recommended-group: Recommended Entries
connected-note: Linked
secondary: Create New Entry
confirm: Redirecting you to logbook...
confirm-new: New logbook entry created
new-entry: 68ME → 68ME | N1327T (PA32) | Today | 0.8 Total

entry: KAUS to KDAL | N1327T (PA32) | Dec 7, 2023 | 1.1 Total
entry: KHYI to KAUS | N1327T (PA32) | Jun 14, 2024 | 0.9 Total | linked
entry: KAUS to KSAT | N1327T (PA32) | Jun 14, 2024 | 0.7 Total | linked
entry: KSAT to KHYI | N4592B (C172) | Jun 12, 2024 | 1.4 Total
entry: KDAL to KAUS | N1327T (PA32) | Dec 6, 2023 | 1.2 Total
entry: KHYI to KHYI | N4592B (C172) | Nov 28, 2023 | 0.6 Total

recommended: KAUS to KHYI | N1327T (PA32) | Jun 14, 2024 | 1.6 Total
recommended: KSAT to KAUS | N4592B (C172) | Jun 20, 2024 | 0.8 Total
```

I’ve removed the checkbox mechanism and instead turned it into a checkmark / removal process. Less cognitive load and clicks overall, and it allows you to easily un-link the track log if you’ve made a mistake.

If a pilot needed to create a new logbook entry, no fuss; when clicking the “Create New Entry” button, the software automatically takes in the track log data and forms a new logbook entry. It also automatically links the track log, because obviously.

Try it out above, see how both feel.

## Reflection

> Most of the work is code you can’t see.

What’s not in this case study is the code itself and a few screens of the logbook data getting imported. Unfortunately, I don’t have any screenshots of those sections and because I’m under NDA I cannot show any code, given that my job was code-heavy and less design-oriented (despite my want and desire to design UI more).

I hope the prototypes above make up for the lack of code. On the topic of code itself, the project took about 6 weeks to create, and during the last week I redid the entire project. ==The comparison above was that last week of time before demo day. I re-designed it and hand coded the logic behind it.==

ForeFlight was a wonderful working environment to expand my passion for code. I’m appreciative that they let me have weekly meetings with the Product Design team so that they could critique my work.
