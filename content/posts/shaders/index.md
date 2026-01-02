---
title: "Shader adventures"
date: 2026-01-02T09:22:00+01:00
author: Rob
categories:
    - coding
    - maths
tags:
    - shaders
toc: true
draft: false
cover: shaders_cover.png
images:
  - shaders_cover.png
---

I realized I’m pretty fascinated by shaders, yet I’d never actually taken the time to understand them. This little page exists to fix that.

Most of what you’ll find here will connect closely with my **Game Adventures** page, so make sure to check that out too!

<!--more-->

## A Coloured Outline Shader

{{< figure src="img/shaders_gage.png" caption="An example of black lines around textures in *Borderlands 2*. (Mecha girl yeah!)" class="float-right" >}}

The first shader I want to share is a simple **coloured outline shader**. Yeah, on its own it can look a bit dumb, but in practice it’s actually super useful. Slapping an outline on things instantly makes them more **readable** and gives that nice **cartoony** vibe. I’m definitely not doing full toon or cel shading here (too dumb for that I’m afraid), but it’s a great first step and a nice way for me to learn the basics without melting my brain.

I used this approach in my game **Strategio** to add a black outline to the board and the palette. Here’s a screenshot:

{{< figure src="img/shaders_board.png" caption="Shading the border of my board texture." >}}

Don’t mind the checker shader, we’ll talk about it a bit later down the line. Now the real question is: how do we mess with a texture so we can create a black outline around it? As usual, shaders involve quite a lot of math… but that’s what’s so fascinating, so let’s try to understand it!

At the base of my texture is the **UV**.



