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
-->

## Context

> Trinity is on the rise, but its digital presence hasn’t caught up.

==Founded in 1869==, Trinity University sits on a 125-acre hilltop campus near downtown San Antonio and is consistently ranked among the nation’s top liberal arts colleges. The academic experience centers on close mentorship, with a student-to-faculty ratio around 9 to 1 across a student body of roughly 2,500 to 2,600.

![Trinity.edu homepage](https://media.kaelub.com/Trinity-Redesign/homepage.png "still 1390/620")

```stats
153% | Growth in applicants over the last 15 years
2017 | Last website redesign
```

These numbers show an accelerating institution, but the website carrying them continued to ==bloat==.

==Published in 2016–2017 and mostly unchanged since==, Trinity.edu still worked well for a surveyor or a lurker, but not for a prospective student wanting to make a decision, a current student trying to find information about their classes, or a curious parent. ==Information was fragmented.==

Yes, there are issues with broken components, messy text, and layouts that make eyes zig-zag, but the main focus should be ==accommodating perspectives.==

![Broken parts of the site on the homepage at a larger resolution](https://media.kaelub.com/Trinity-Redesign/broken.png "still 1390/620")

## The Roadmap | The goal, the reasoning behind it, and where the project actually landed.

### The goal

Create new school, department, and program webpages that keep consistency with the other design elements already living on Trinity.edu, and reconfigure navigation around the end user. As Trinity continues to rise in the ranks, we needed a better user experience so that current students and prospects could find useful information quickly.

### Why

Our data showed that most people visiting the site were prospective students rather than current students. That told us one of two things was true: either there was important information missing from the current iteration of the website, or much of what was there simply wasn’t needed. I wanted to change that.

### The outcome

**This project’s scope grew and became the foundation for a full site redesign.** ==Leadership changed direction mid-project, folding this work into a full site redesign: the journey maps, the AI audit, and small bits of the design system all carried forward into that larger effort.==

## The User Experience Goal | Not “make it look nice.” Make it fast to skim.

The overall goal wasn’t to get the website to merely look nice, although that was definitely one of our sub-goals, but to give our numerous personas a way to get to insightful information from the website quickly.

The existing experience is dated, which makes a quick skim for useful information difficult. ==In the age of AI, it also makes web crawler information collection disorganized.== Most students now use AI to look for colleges, so I pushed toward making the website friendly to our AI companions too.

Designing for AI would mean making more bulleted lists and less marketing-heavy text, just quick facts as soon as you get into a page.

## Research

> Page audits, outside research, and five journey maps.

### Page audit and outside examples

I started by seeing what research had already been completed, starting with independent agency audits.

We started with an audit of which webpages needed the most work, and opted to start at the top — the schools. We researched other institutions’ school webpages, ideally liberal-arts focused, then built four different example sheets, one per Trinity school, each averaging about six examples to choose from for excellent design and UX standards. Many of those designs came from Ivy League or well-known liberal arts institutions.

Essentially: a lot of analysis of what other websites are doing well and what they could improve upon.

### Third-party UX research

We had a third-party team come in and audit the current website, and their findings only reinforced the narrative that a redesign was needed. Some issues we already knew about going in, but new ones crept up too.

![](https://media.kaelub.com/Trinity-Redesign/r1.jpg "still 698/412")
![](https://media.kaelub.com/Trinity-Redesign/r2.jpg)

![](https://media.kaelub.com/Trinity-Redesign/r3.jpg "still 698/366")
![](https://media.kaelub.com/Trinity-Redesign/r4.jpg)

![Independent agency research audits that our website revisions were based on.](https://media.kaelub.com/Trinity-Redesign/r5.jpg "still 698/402")

```insights
San Antonio culture | The site under-represented the city and campus culture that the brand campaign leaned on.
Video headers | There was no support for a video header, which the new campaign material was built around.
Program page consistency | Program pages had drifted apart from each other with no shared structure.
Frustrating navigation | Users struggled to move between schools, departments, and programs.
```

==It’s great knowing all the research that has already been done to find out what is wrong with our site, however what we need to know most is the present material. How do our users currently react to the site? What perspectives utilize the site most?==

We discover this within journey mapping.

### The differentiator

**I built an AI agent that used our journey maps to audit all 4,000+ pages on the site, cutting the audit timeline in half.**

![](https://media.kaelub.com/Trinity-Redesign/j1.jpg "still 877/670")
![](https://media.kaelub.com/Trinity-Redesign/j5.jpg)

![](https://media.kaelub.com/Trinity-Redesign/j2.jpg "still 877/434")
![](https://media.kaelub.com/Trinity-Redesign/j3.jpg)

![Journey maps for each perspective that uses our site.](https://media.kaelub.com/Trinity-Redesign/j4.jpg "still 873/405")

To understand the many perspectives on the Trinity.edu site, I created five journey maps: ==current student, prospective student, job applicant, alumni, and donor.== Creating all five took a few months of work to get correct, with ==a few interviews with deans of schools and many back-and-forth emails.==

These were for gathering pain points in the current site and for telling the team where the hoops are that each of these individuals has to jump through to reach their destination.

I later used those journey maps to build an ==AI agent that helped us audit all 4,000+ pages on the site for the full redesign project, cutting the audit time down by a few months.==

```stats
5 | Journey maps: current student, prospect, job applicant, alumni, donor
4,000+ | Pages audited across the full site
Halved | Audit time, with the journey-map-driven AI agent
```

During the infancy of ChatGPT agents, I created a small agent to fully utilize our five journey maps and fine-tuned it with certain parameters, like how our perspectives respond to certain parts of our site, to match the tone and tenor of what modern schools do.

So, given this amount of data:

```hmw
How might we redesign the programs, departments, and schools of the Trinity.edu website to aid our current students but build for an infrastructure changing alongside the speed of AI?
```

## Our Philosophies

At first, the schools pages had to keep using the old components, due to budget and leadership priorities. But over the months of redesigning schools, programs, and departments, leadership changed and the mission became to completely redo every component in the Drupal system. It was fair game. So the wireframes contain a mix of old elements and new ones.

![Wireframes of the design following these philosophies](https://media.kaelub.com/Trinity-Redesign/wireframes.jpg "still 1587/1396")

### Outcomes first, vibes second

We started with statistics near the top of the hierarchy on the school sites. People want to see outcomes and then vibes, so we approached it uniformly — giving the user what they came for first.

![School home page featuring outcomes near the top for our prospective students](https://media.kaelub.com/Trinity-Redesign/schoolhome.jpg "still 862/1305")

Once the user dove into the pond — into the undergraduate or graduate pages — all programs were listed under their department. That dampened the amount of work the user had to do to find the right information. Now it’s all in one place.

### Honesty over marketing

We stray away from fully marketed pages almost immediately, right after the user passes the header of the schools page. Prospects want honesty and the grit of the institution — they want to know exactly what they’re getting into. So we supply them with current news around campus and the upcoming events for each school.

![Mobile view featuring news and honest stories about our campus](https://media.kaelub.com/Trinity-Redesign/mobile.jpg "still 1610/876")

Users also want personal anecdotes, so I include videos or photos of alumni and current students participating in the activities the schools put on.

## Reflection

Unfortunately, the designs were never fully completed, due to the change in direction of the project. The mobile formats were finished; the desktop versions were not.

Despite that, the designs are sleeker and more cinematic than their predecessors. It’s easy to tell where you are thanks to certain elements near the navbar, and the warmth of Trinity’s campus comes through in the darker tones. Information is organized neatly and tells a story.
