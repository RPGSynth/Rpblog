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
math: true
---

I realized I’m pretty fascinated by shaders, yet I’d never actually taken the time to understand them. This little page exists to fix that.

Most of what you’ll find here will connect closely with my **Game Adventures** page, so make sure to check that out too!

<!--more-->

## A Coloured Outline Shader

{{< figure src="img/shaders_gage.png" caption="An example of black lines around textures in *Borderlands 2*. (Mecha girl yeah!)" class="float-right" >}}

The first shader I want to share is a simple **coloured outline shader**. Yeah, on its own it can look a bit dumb, but in practice it’s actually super useful. Slapping an outline on things instantly makes them more **readable** and gives that nice **cartoony** vibe. I’m definitely not doing full toon or cel shading here (too dumb for that I’m afraid), but it’s a great first step and a nice way for me to learn the basics without melting my brain.

I used this approach in my game **Strategio** to add a black outline to the board and the palette. Here’s a screenshot:

{{< figure src="img/shaders_board.png" caption="Shading the border of my board texture." >}}

Don’t mind the checker shader, we’ll talk about it a bit later down the line. For now, the real question is: **how do we mess with a mesh so we can create a black outline around it?**  
As usual, shaders involve quite a lot of math… but that’s also what makes them fascinating, so let’s try to understand what’s actually going on.

At the base of everything is the **UV** of the mesh. From what I understand, UVs are basically the coordinate system of a mesh once it’s been flattened. Since a mesh is unwrapped onto a plane, UV space is essentially a 2D coordinate system with coordinates called **u** and **v**.

Visually, UVs go from $(0,0)$ to $(1,1)$:

• bottom-left corner → $(0,0)$  
• bottom-right corner → $(1,0)$  
• top-left corner → $(0,1)$  
• top-right corner → $(1,1)$  

So you can think of **u** as “left → right across the tile” and **v** as “bottom → top across the tile”.

In Unity, the UV node outputs a `float4`, meaning a $4 \times 1$ vector per pixel[^pixel-note]. As far as I know, the $z$ and $w$ components are just $0$, so we ignore them. What we really keep are the **u** and **v** components.
{{< figure src="img/shaders_uv.png" caption="Visualising the UV field for a given mesh." >}}

[^pixel-note]: From here on, when I say “pixel”, I really mean a *fragment*: one execution of the fragment shader for a given UV. It’s technical linguo and not necessary at this level, but I’m mentioning it once just to be clean.

Now an important detail (and honestly one of the coolest parts): **this is not computed once for the whole mesh**. The GPU runs the same little program for *every pixel* of the mesh, in parallel. Each pixel gets its own UV value, and the shader does the same operations independently.

Now here’s the neat trick.

If **u** represents the distance to the *left* edge, then $1 - u$ represents the distance to the *right* edge.  
Similarly, if **v** is the distance to the *bottom* edge, then $1 - v$ is the distance to the *top* edge. What we want is not the distance to just one edge, but the distance to **the closest edge**, no matter which side we’re looking at. **That’s equivalent of taking the minimum of the 4 possible distances**.
In Unity Shader Graph, this is usually done in two steps. First, we handle left/right and top/bottom separately:

$$
\text{minU} = \min(u,1-u), \qquad \text{minV} = \min(v,1-v)
$$


At this point, we already get zeros near the edges and corners, and we don’t care anymore *which* side we’re on. Then we combine everything by taking another minimum:

$$
\text{edgeDist} = \min(\text{minU},\text{minV})
$$

This value which can be seen as an **edge distance** is computed for every pixel. The resulting field lives in the range $[0,0.5]$:  
• $0$ exactly on the edges  
• $0.5$ at the center of the texture  
{{< figure src="img/shaders_minimum.png" caption="Minimum operations isolates the edges." >}}
Here’s a tiny example just for **u**. In UV space, going left → right, the uv values could look like this (same on each row):

<div>
$$
u =
\begin{bmatrix}
0 & \tfrac13 & \tfrac23 & 1 \\
0 & \tfrac13 & \tfrac23 & 1 \\
0 & \tfrac13 & \tfrac23 & 1 \\
0 & \tfrac13 & \tfrac23 & 1
\end{bmatrix}
$$
</div>

Then the shader also implicitly has access to $1-u$ for each fragment:

<div>
$$
1-u =
\begin{bmatrix}
1 & \tfrac23 & \tfrac13 & 0 \\
1 & \tfrac23 & \tfrac13 & 0 \\
1 & \tfrac23 & \tfrac13 & 0 \\
1 & \tfrac23 & \tfrac13 & 0
\end{bmatrix}
$$
</div>

Now we apply the operation $\min(u,1-u)$ this minimum is computed **cell-by-cell**, all at the same time on the GPU:

<div>
$$
\min(u,1-u) =
\begin{bmatrix}
0 & \tfrac13 & \tfrac13 & 0 \\
0 & \tfrac13 & \tfrac13 & 0 \\
0 & \tfrac13 & \tfrac13 & 0 \\
0 & \tfrac13 & \tfrac13 & 0
\end{bmatrix}
$$
</div>

So without caring about “left” or “right” anymore, we turned *both edges* into zeros. That’s exactly what we want. Same idea for **v** (bottom/top), except it varies vertically instead of horizontally.

Now we want to turn this smooth edge distance field into something usable as a mask. For that, we use a step function. First, here’s the definition (so we all agree on what “step” means):
<div>
$$
\text{step}(w,x)=
\begin{cases}
0, & x < w \\
1, & x \ge w
\end{cases}
$$
</div>

In our shader, we use it like this:

$$
\text{mask} = \mathrm{step}(w;\text{edgeDist}), \qquad w = \text{OutlineWidth}
$$

So if $\text{edgeDist} < w$ (close to the border), the mask becomes $0$.  
And if $\text{edgeDist} \ge w$ (more inside the texture), the mask becomes $1$.
This means the larger $w$ is, the thicker the outline. Once $w$ reaches $0.5$, everything becomes $0$ and the whole texture is outlined (aka fully black, not very useful).
What matters is that this step operation discretizes the field into $0$s and $1$s, which means we can now treat it as a **boolean mask**.

At this point, all that’s left to do is to mix (interpolate) two textures a base texture and a black (or coloured) outline texture.
To do that, we use a simple linear interpolation, also known as **LERP** (this will come back A LOT, but its not mandatory to understand it deeply for now). With a mask called $t$, the interpolation is:

$$
\mathrm{lerp}(A,B,t) = A(1-t) + Bt
$$

In our case, this becomes:

$$
\text{finalRGB} = \text{outlineRGB}(1-\text{mask}) + \text{baseRGB}(\text{mask})
$$
When I write *baseRGB* or *outlineRGB*, I’m talking about **colors**, not some abstract vectors. In shaders, colors are almost always represented as RGB values: three numbers corresponding to the **Red**, **Green**, and **Blue** channels.
So *baseRGB* is just the color sampled from the base texture at the current UV picked at $\text{mask} = 1$, and *outlineRGB* is the color we want for the outline (black in our case, but it could be anything) picked at $\text{mask} = 0$. Technically these are 4-component vectors, but thinking of them as “colors” is perfectly fine here.

And… that’s it.  We now have a clean outline shader driven purely by UV math, pretty neat ✨
{{< figure src="img/shaders_lerp.png" caption="Discretizing and Lerping RGB's allows to get the final mesh. " >}}

## A Smooth piece Shadow Shader
As I was making my board game I realised using flat textures for my piece meshes was not looking very nice. In practice many board games have a small shader on the pieces that adds a diagonal shadow on top of the pieces. It makes them feel more gamey or cartooney but also somehow a bit more believable. My pieces lacked this so I had to make this shader myself. 
