<!--
  Occluded Forest. Sidebar details (title, year, summary, outcomes, team, hero video) live in
  src/data/caseStudies.ts. Set in the v2 layouts: the syntax and layouts are listed at the top
  of src/lib/caseStudyMarkdown.ts. Hero video by Hayden Kim Dernbach.
-->

## Overview

```academic
This is academic work completed while attending the University of Washington for my masters
```

> Our senses are important for a sense of place.

Looking through a VR headset, it’s easy to feel like you aren’t really there, because the world in front of you doesn’t acknowledge your main senses: sight and sound.

==When the world doesn’t acknowledge you, it stays a picture instead of a place.==

As humans, we tend to feel a small narcissistic injury when something doesn’t acknowledge us, and an environment that doesn’t react to us is no exception. In VR that feeling is stronger, because everything else is so immersive.

Occluded Forest was envisioned by [Hayden Kim Dernbach](https://haydenkdernbach.com/foc). My task was to find ways to give the player a sense of presence in it.

## Audio {#audio}

> The forest needed mystery and brightness: frigid, yet nostalgic.

Hayden’s environment has a frigid yet nostalgic color scheme, and I knew right away the atmosphere needed to match it with some mystery and brightness. I started on a small lo-fi soundtrack that fit the environment, along with short tones of acknowledgement from the animals around the forest.

![Creating audio in Ableton](https://media.kaelub.com/Occluded/Abelton.png "still 1890/766")

### Audio tracks

Ethereal tones and deep sub-bass help build a sense of place. The catch was the headset: its tinny speakers couldn’t reproduce low bass well, and too much of it vibrates the headset, which breaks immersion. So I pushed in as much sub-bass as I could without crossing that line.

![Soundtrack](https://media.kaelub.com/Occluded/audio/Soundtrack.mp3)
![Found jingle](https://media.kaelub.com/Occluded/audio/Found_Jingle.mp3)
![Intro (unused)](https://media.kaelub.com/Occluded/audio/Intro_Unused.mp3)

## Triggering the Audio {#triggers}

> The mushroom path does two jobs: it guides the player, and it tells the forest they’ve arrived.

In the experience, the player follows a path of glowing mushrooms, made by Macks, that leads to animated deer around the forest. The deer are hidden behind rocks and trees, and some branches are shaped like antlers, so the player might think a deer is just around the corner when it isn’t. When they find a real one, the forest needed to acknowledge it.

![Unity’s collision box acting as a trigger](https://media.kaelub.com/Occluded/triggerbox.png "still side 977/925")

Using the mushroom path as the trigger kills two birds with one stone. The mushrooms contrast with the snow, so players naturally stay on the path, and the path always ends somewhere a real deer is in view. In Unity, I placed a trigger box there that fires when the player walks into it.

### Coding it

Each cue only needed to play once per trigger box, so the script checks whether the sound has already played. That keeps it from repeating every time the player steps back in.

```csharp playSoundonEnter.cs
using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class playSoundonEnter : MonoBehaviour
{
    AudioSource source;
    private bool hasPlayed = false;

    void Awake()
    {
        source = GetComponent<AudioSource>();
    }

    private void OnTriggerEnter(Collider other)
    {
        if (!hasPlayed)
        {
            source.Play();
            hasPlayed = true;
        }
    }
}
```

```youtube
98AggoLb2AQ
```

## Reflection {#reflection}

> Being acknowledged makes a world feel real, but there’s a line between being noticed and being watched.

Looking back, sound did a lot of the work in making the forest feel like it knew the player was there. A small cue at the right moment, like the jingle when you find a deer, said more than another visual effect would have.

I also tried taking that further with a head-following mechanic that only the deer would have, so they’d turn to look at you. In playtesting it was fascinating at first, but after a while it became creepy. That taught me acknowledgement has a limit.

With only three weeks, I couldn’t take it further. Given more time, I’d tie the head-following into the deer animations my teammates made, and tune it so the deer notice you without fixating on you.

```decision
Past a certain point, the world stops feeling alive and starts feeling like it’s staring at you.
```
