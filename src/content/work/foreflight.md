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

## Context

> ForeFlight builds the electronic flight bag most U.S. general aviation pilots fly with.

Flight planning, weather briefings, charts, and a digital logbook that has to hold up the same way a paper one does. I joined the Debriefing team for the summer as a software engineer intern, working alongside product design.

![](/work/foreflight/context.jpg)

## Error Bar

> A more nuanced error bar, for QA testers and for pilots.

ForeFlight’s debriefing system grades a pilot from flight data collected by the app and ForeFlight’s hardware, organized into Track Logs: telemetry, flight paths, distance, airport codes, times, and coordinates.

When QA ran a test, or a real error reached a customer’s dashboard, the existing design didn’t say what the issue was — or whether it was an error at all. I designed and built variants for internal testing and for pilots, with the error code printed to the console for QA. Engineers and testers loved it, and it was my first collaboration with product design.

![](/work/foreflight/error-variants.jpg "still 1461/530")

## Track Logs

> Linking Track Logs to logbooks on the web.

The iPad app let pilots link Track Logs to their logbooks mid-flight; the web app couldn’t. Linking automates flight-time math, consolidates fragmented journeys — a multi-leg day, or a recording split by an overheating iPad — into one clean entry, and attaches GPS-backed proof for debriefs, insurance, and FAA currency.

On the surface the design is simple. The hard part was underneath: connecting all of that telemetry, then mutating or creating the logbook entry it lands in.

## Variants

> Seven passes at one modal.

The flow only works if pilots press the button, so the modal went through seven variants to find which information architecture read best at first glance — from a bare route and button, to a sentence explaining the benefit, to a plane-plus-logbook icon pair, ending in a confirmation that hands off to the logbook.

Every variant assumed a single track log, but a pilot’s day is rarely one flight. A picker submenu helped, but it still couldn’t create a new entry, and it was unclear which way the link went.

## Final Design

> Reversing the flow: start from the track log you clicked.

The final design links the track log you’ve already selected before the modal opens, then shows recent and recommended logbook entries. I replaced checkboxes with a single check-and-remove toggle — fewer clicks, easy to undo — and Create New Entry builds and links an entry straight from the track log’s data.

## Reflection

> Most of the work is code you can’t see.

The project took about six weeks, and in the final week before demo day I redesigned it and hand-coded the logic again. Because the work was code-heavy and under NDA, I can’t show the code or the imported logbook data here.

ForeFlight was a wonderful place to grow my passion for code, and I’m grateful for the weekly critiques with the Product Design team.
