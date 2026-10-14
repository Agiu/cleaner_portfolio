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

## Problem

> Earbuds trap heat and fall out. Over-ear headphones are too heavy to wear all day. Nothing sits in between.

```masters
```

![Project Open](https://media.kaelub.com/Audio/headphone_render.jpg "still 3508/1818")

We’ve all experienced issues with comfort among our headphones and earbuds. Many companies have attempted to solve universal comfort issues across all mediums — Virtual Reality, Personal handheld devices, and more with little to no success.

![On right: Human headphones which failed due to a few factors but majorly around comfort, on left: Apple’s AirPods Max which sound great but will cause fatigue after extended use due to different hair styles of users](https://media.kaelub.com/Audio/comparison.png "still 2740/938")

My team of design friends and I came together to try and address these frustrations with ==a new form factor design that maintains continuous comfort, while mitigating the common issues seen in typical audio form factors.==

This project ended up turning into a big lesson on team dynamics, team management, and learning on the fly to create a high quality product. Collectively we all had interests in wearable devices and we thought there could be something within the audio space, however we had little to no experience in industrial design.

## Validating our assumptions

> Five interviews and 5,400 words confirmed what we suspected: pain, heat, and instability drive people away from their headphones.

To narrow down our problem space, I insisted on gathering heuristic assumptions firstly, then validating those assumptions with research. ==Our assumptions were around comfort and general frustrations like ear pressure, heat build-up, and instability.== These needed to be validated, of course; maybe through some user research?

### Conducting user interviews to understand the problem space

```stats
5 | Total user interviews
5,400 | Words transcribed
4 days | To recruit and interview participants
```

```button
View Interviews | https://docs.google.com/document/d/17wlYGyDGmDJn1tCKFC4ODD3lw5XimgeTamJ1faz2z-4/edit?usp=sharing
```

The interviewees we recruited were from people around the UW MHCI+D cohort, and a few relatives and friends. The questions at first were generally written along the lines of “why do you wear headphones” and “walk me through your experience with…” and as the interview evolved we honed in on more specific questions or assumptions we had from our own heuristic analysis of most headphones (the aching, moisture collection, etc.).

After the interview process, we began synthesizing the transcribed portions and applying an empathy map model to each sentence or phrase we found in common, with a goal of finding a problem space with common issues. We chose the empathy map method because of its effectiveness in identifying obvious pain points and outlining common emotional themes we may have missed during the interviews.

![The goal was to find a few problems within our space and what we found out is our assumptions were generally correct. We just needed to verify them through user research.](https://media.kaelub.com/Audio/empathy_map_1.png "still 2900/1358")

```quotes
I always feel like these over-ear headphones are going to fall off | Interviewee 1
Earrings can get squeezed into my skin with some padding. | Interviewee 3
I wear headphones when I work out because they help me structure my workouts | Interviewee 2
My ideal earphone would fit in my ear properly and I won’t have to keep adjusting | Interviewee 5
Headphones are more comfortable in the long run, but I do get fatigue from the extra weight sitting on my head | Interviewee 5
```

So, by using these empathy maps and some AI analysis from Figma itself, we identified several core findings that validated our assumptions.

```insights
Social Pressures & Aesthetics | Users consider social pressures, situational awareness, and aesthetics when selecting headphones.
Literal Pain Points | Users experience pain and discomfort, such as sweaty ears, pressure points, and earbuds falling out.
Universal Form Factors | Users desire headphones that are compact for transport, have adjustable features, and fit properly.
```

The AI assistance aided in finding common themes across all phrases we collected, but to hold the AI accountable we searched through each common theme to make sure there was validity. If validity did not exist, we would create our own theme around the excess — if need be.

From these findings we created a few how might we’s that could lead us to ==designing a product==.

```hmw
How might we design wearables that are lightweight, portable, and comfortable (even with a degree of variance e.g. wearing glasses)
```

```button
View Research Analysis | https://www.figma.com/board/seMvdbF8VlQxQLFU1DzH1T/CKHAM--Empathy-Maps---Findings?node-id=287-2055&t=U84CDWwuTr7xnvhD-1
```

## Exploring form

> We sketched wide, from utilitarian joints to VR-inspired hovering speakers, before landing on one shared instinct.

![Early ideation sketches exploring utilitarian, bandless, and double-curve headband designs.](https://media.kaelub.com/Audio/image_placeholder_2.JPG "still 1226/904")

### Sketching From Inspiration

We centered many of our inspirational material around things we found on the internet and sketches we conjured up ourselves. Personally, I went after VR headsets which allowed for over-ear hearing much like what you see on the Valve Index, which was actually one of my references. These wearables don’t exactly sit on your ear, but have the same quality as regular open-back headphones.

![My “beautiful” sketches for possible designs of our new audio wearable.](https://media.kaelub.com/Audio/image_placeholder_3.JPG "still 863/747")

Many of my teammates thought the utilitarian idea was striking, but a little too controversial for the public. The joint system I built could work for all head sizes, however aesthetically it looks quite annoying to view and may add head pressure, which is where we want to move away from when focusing on our multiple how might we’s.

### Removing a Common Audio Wearable Trope

The idea of a bandless headset kept returning during ideation. Inspired by VR headsets that hover speakers over the ears rather than pressing on them, we realized that removing the band was the ultimate way to achieve a truly lightweight, comfortable form factor.

![Small sketch by Hannah](https://media.kaelub.com/Audio/Bandless.png "still clear 2000/1414")

After much deliberation and indecisiveness about how we can get a bandless headset on someone’s ears without it falling off we decided to just “yolo” it as some of us have said. ==In actuality, we split as a group to find out if we could still add in a headband just to make our designing lives easier. It did not.==

![Ideas for a potential headband design for our audio wearables](https://media.kaelub.com/Audio/image_placholder_11.png "still 2924/1424")

At the end of the day, the spring-lock mechanism was too difficult for me to design — and given our constraints around time, we needed to act fast with our prototyping. Creating a mechanism like this will take at least two of us a few days to even get to finishing the 3D model.

==We decided to fully commit to the bandless design.==

## Prototyping & Iteration

### A Transition to 3D Iteration

![From drawing to 3D prototype](https://media.kaelub.com/Audio/image_placeholder_4.JPG "still 1475/723")

I started with the foundation: how it will wrap around the ear. I created my first Blender modeling project and iterated over and over again after a design one of my group members made (Meera). A few of our group members delegated themselves to read some articles on common ear sizes, which influenced how I shaped the curves on the 3D model. ==Many bumps exist on the ear, different lobe types as well, so I needed to be inclusive of many of those attributes.== The large circle on the right of the 3D model acted as a counter weight for the ear — alleviating the weight from pushing onto the back of the ear, which feels uncomfortable.

![First iteration of the foundation. This allowed the ear to poke through the middle and sit on the cranium.](https://media.kaelub.com/Audio/image_placeholder_5.png "still clear 16/9")

While structurally a good start, the execution failed in user testing. The rough 3D printing filament created harsh edges, causing sharp pain just from putting the device on. The difficulties about this design was figuring out where to put the speaker head and how to put on the headphone foundation with ease.

I had the foundation created, but attaching a speaker seems so counter intuitive in this state, and putting it on was causing some skin irritation as said by some user testers. By this moment in time we had already eaten through three weeks and needed to come up with other ideas quickly. Iteration with 3D was also slow. ==It wasn’t my first time messing around with 3D printing, however each print took quite some time due to the traffic each printer was having.==

### See It From Another Perspective

The group and I were stuck, iteration became increasingly slow as our ideas and prototyping came out slowly. We took a few days from each other to decompress and even stopping our arguments about what is the best design choice for us in this moment. It was never a clear ending. ==It wasn’t until someone else in my group finished an idea he had, which allowed me to see the project from a different perspective.==

As I was stuck on this design; stuck on the simplicity of taking it on and off. Other group members worked on a design that was incredibly easy to put on and take off… However, it could easily pop off the ear given enough bump. They called it the donut, however what was appealing to me wasn’t the casing around it, but the foundation. There’s no inner-ear support. Putting it on was quite literally dropping it on the top of your ear.

![Getting rid of literal pain points on our prototype](https://media.kaelub.com/Audio/image_placeholder_6.JPG "still 878/688")

## The breakthrough

> Tri-Axis Support: three foam-padded cylinders that hold the headset in place without ever touching the inside of the ear.

I took the idea of removing the inner sections of my foundation from the donut concept, which seemed to work flawlessly. Putting it on and taking it off became even easier than expected.

During this process a breakthrough occurred and we called it the “Tri Axis Support”. We merged concepts by keeping the open-ear “donut” foundation but introducing “tri-axis support cylinders” to help alleviate the weight distribution across the ear itself.

By adding foam to these cylinders, they acted as padding that gently pushed against the ear and cranium. This pressure was just enough to keep the entire device highly secure without needing invasive inner-ear support and would allow pressure to move from the ear and instead onto the side of the head itself.

![Integration of tri-axis support cylinders, securing the device comfortably without inner-ear pieces](https://media.kaelub.com/Audio/image_placeholder_7.JPG "still 1166/862")

So I cut the inner bit of the ear foundation out, completely. And as it turns out, the cylinder support I created actually does more than originally thought. Those cylinders with foam, acting as padding between the cranium and headphone prototype, push against the ear and cranium just enough to keep the whole device extra-secure.

This was it. I modeled a speaker with holes for wiring that sat right above the ear. The team as a whole found this method much more impactful due to its ease to put on and the comfort — while still allowing earrings and other peripherals.

```3d-model
/models/project-open.bin
```

```quotes
I left it on for the whole day accidentally while filming the project video and I kept forgetting they were on me… it’s super comfortable. | Alexander Akande
```

![Final Headphones Render](https://media.kaelub.com/Audio/image_placeholder_8.png "4/3")

## Final spec

> A bandless headset, sized to any ear, built for all-day wear.

- **The Design:** A highly comfortable, small, bandless headset that avoids pressure points and is printed in different sizes to accommodate all users.
- **Materials:** Constructed from PTB Plastic to ensure a durable and lightweight fit.
- **Battery:** Equipped with a 105mAh Lithium Polymer battery per earphone, offering 11 hours of life with 1-hour charge times.
- **Audio Tech:** Features beamforming microphones on the bottom tip and inner speakers to isolate the user’s voice and cancel background noise. Uses Bluetooth to connect to the user’s phone.

==These audio wearables are perfect for commuting publicly and for comfort.==

![](https://media.kaelub.com/Audio/image_placeholder_9.png "still clear 16/9")

```youtube
2mzSQccg3mY
```

## Reflection

Moving forward, I would have loved more time to flesh out the design further, particularly the interior of the form factor. My teammates had established viable interior chips by the end of the project, but we only had about two days to work with them. A significant portion of our time was also consumed by repeated printing iterations to nail the tiered fits, which cut into valuable design time.

From the start, I wanted these to work well for casual and commuter use, comfortable enough to wear outside while still letting you hear your surroundings. One thing I failed to account for, though, was aerodynamics. The design handled them poorly; at even a brisk running pace, wind noise would drown out the music entirely. It’s something I didn’t have the time to address.

On a brighter note, our main actor wore Project Open throughout the entire video shoot for three days, only taking them off after shooting finished (which was usually 7 hours long!). To me, that speaks to the comfort we were aiming for. Hell, I can’t even wear my AirPods for more than 2 hours without them falling out or becoming uncomfortable from the moisture they trap.

— **Caleb Aguiar**
